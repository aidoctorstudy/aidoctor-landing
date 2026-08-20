// ════════════════════════════════════════════════
// WIRE UP GOPANEL FOR NEW PANELS
// ════════════════════════════════════════════════
// [merged into goPanel]

// Auto-add flashcards to SRS when they're created
var _origRenderCardsSRS = renderCards;
renderCards = function() {
 _origRenderCardsSRS.apply(this, arguments);
 if(cards && cards.length) {
 srsAddCards(cards, 'General');
 }
};

// Add activity tracking
var activityLog = JSON.parse(localStorage.getItem('aid_activity')||'[]');
function addActivity(icon, text) {
 activityLog.unshift({icon:icon, text:text, time:Date.now()});
 if(activityLog.length > 20) activityLog.pop();
 localStorage.setItem('aid_activity', JSON.stringify(activityLog));
}

// Init on load
setTimeout(function(){
 // Render Lucide icons
 if(typeof lucide !== 'undefined') lucide.createIcons();
}, 600);


// ════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM V2
// ════════════════════════════════════════════════
function showToast(msg, type, duration) {
 type = type || 'info'; duration = duration || 3000;
 var stack = document.getElementById('toastStack');
 if(!stack) { showNotif(msg); return; }
 var icons = {success:'check-circle-2', error:'alert-circle', info:'info', xp:'zap'};
 var toast = document.createElement('div');
 toast.className = 'toast ' + type;
 toast.innerHTML = '<span style="display:flex"><i data-lucide="' + (icons[type]||'info') + '" style="width:16px;height:16px"></i></span><span>' + esc(msg) + '</span>';
 stack.appendChild(toast);
 if(typeof lucide !== 'undefined') lucide.createIcons();
 setTimeout(function(){ toast.classList.add('show'); }, 10);
 setTimeout(function(){ toast.classList.remove('show'); setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 300); }, duration);
}

// Override showNotif to use toast system
function showNotif(msg) {
 var type = msg.includes('') || msg.includes('Error') ? 'error' :
 msg.includes('') || msg.includes('done') || msg.includes('saved') ? 'success' :
 msg.includes('XP') || msg.includes('') || msg.includes('') ? 'xp' : 'info';
 showToast(msg, type);
}

// ════════════════════════════════════════════════
// MEME ACHIEVEMENTS
// ════════════════════════════════════════════════
var MEME_ACHIEVEMENTS = [
 {id:'cramming', icon:'moon', name:'Cramming Survivor', condition: function(){ return totalQs >= 20; }},
 {id:'pharma_demon', icon:'pill', name:'3AM Pharmacology Demon', condition: function(){ return totalXP >= 500; }},
 {id:'path_destroyer', icon:'microscope', name:'Pathology Destroyer', condition: function(){ return totalCards >= 50; }},
 {id:'caffeine', icon:'coffee', name:'Caffeine Bloodstream', condition: function(){ return streak >= 3; }},
 {id:'locked_in', icon:'target', name:'Locked In', condition: function(){ return totalXP >= 200; }},
 {id:'final_boss', icon:'crown', name:'Exam Final Boss', condition: function(){ return totalXP >= 1000; }},
 {id:'flash_king', icon:'layers', name:'Flash Card King', condition: function(){ return totalCards >= 100; }},
 {id:'streak_god', icon:'flame', name:'Streak God', condition: function(){ return streak >= 7; }},
];
var unlockedAchs = JSON.parse(localStorage.getItem('aid_meme_achs') || '[]');

function checkMemeAchievements() {
 MEME_ACHIEVEMENTS.forEach(function(ach) {
 if(unlockedAchs.indexOf(ach.id) === -1 && ach.condition()) {
 unlockedAchs.push(ach.id);
 localStorage.setItem('aid_meme_achs', JSON.stringify(unlockedAchs));
 showMemeAch(ach);
 }
 });
}

function showMemeAch(ach) {
 var popup = document.getElementById('memeAchPopup');
 var icon = document.getElementById('memeAchIcon');
 var name = document.getElementById('memeAchName');
 if(!popup) return;
 icon.innerHTML = '<i data-lucide="'+ach.icon+'" style="width:28px;height:28px"></i>';
 if(typeof lucide !== 'undefined') lucide.createIcons();
 name.textContent = ach.name;
 popup.classList.add('show');
 fireConfetti();
 setTimeout(function(){ popup.classList.remove('show'); }, 4000);
}

// ════════════════════════════════════════════════
// SHARE CARD
// ════════════════════════════════════════════════
function openShareCard() {
 var overlay = document.getElementById('shareCardOverlay');
 if(!overlay) return;
 document.getElementById('scName').textContent = 'Dr. ' + (sName || 'Student');
 document.getElementById('scRank').textContent = getLevel ? getLevel().name : 'Medical Student';
 document.getElementById('sc-xp').textContent = totalXP;
 document.getElementById('sc-streak').textContent = streak || 1;
 document.getElementById('sc-cards').textContent = totalCards;
 var badges = [' Locked In', ' On Fire', ' Grinding', ' Focused', ' Legend'];
 document.getElementById('scBadge').textContent = badges[Math.min(Math.floor(totalXP/200), badges.length-1)];
 overlay.classList.add('on');
}
function closeShareCard() { document.getElementById('shareCardOverlay').classList.remove('on'); }
function shareCardCopy() {
 var lvl = typeof getLevel === 'function' ? getLevel().name : 'Medical Student';
 var text = 'AI Doctor Study Stats\nDr. '+(sName||'Student')+' | '+lvl+'\nXP: '+totalXP+' | Streak: '+streak+' days | Cards: '+totalCards+'\naidoctor.study';
 navigator.clipboard.writeText(text).catch(function(){});
 showToast('Stats copied! Share on social media ', 'success');
}

// ════════════════════════════════════════════════
// COMMAND PALETTE
// ════════════════════════════════════════════════
var CMD_ITEMS = [
 {icon:'', name:'Growth Mode', sub:'AI coach, habits, focus & productivity', panel:'growth', shortcut:'G'},
 {icon:'', name:'Nibble Mode', sub:'TikTok-style medical study bites', panel:'nibble', shortcut:'N'},
 {icon:'', name:'Dashboard', sub:'Home screen', panel:'dash', shortcut:''},
 {icon:'', name:'AI Chat', sub:'Ask any medical question', panel:'chat', shortcut:'C'},
 {icon:'', name:'Flashcards', sub:'Make and study cards', panel:'flash', shortcut:'F'},
 {icon:'', name:'Analytics', sub:'Track your progress', panel:'analytics', shortcut:'A'},
 {icon:'', name:'Case Solver', sub:'Clinical cases', panel:'cases', shortcut:''},
 {icon:'', name:'Exam Prep', sub:'MCQs for USMLE/PLAB/MBBS', panel:'examprep', shortcut:'E'},
 {icon:'', name:'Clinical Simulation', sub:'Patient management', panel:'simulation', shortcut:''},
 {icon:'⏱', name:'Mock Test', sub:'Full exam simulation', panel:'mocktest', shortcut:''},
 {icon:'', name:'Quiz Game', sub:'Gamified quizzes', panel:'quiz', shortcut:'Q'},
 {icon:'', name:'Mistake Book', sub:'Review wrong answers', panel:'mistakebook', shortcut:''},
 {icon:'', name:'Study Plan', sub:'AI study planner', panel:'studyplan', shortcut:''},
 {icon:'', name:'Lecture Notes', sub:'Summarise lectures', panel:'lecture', shortcut:''},
 {icon:'', name:'PDF Mode', sub:'Chat with your PDF', panel:'pdfmode', shortcut:''},
 {icon:'', name:'Podcast Mode', sub:'Audio study summaries', panel:'podcast', shortcut:''},
 {icon:'', name:'Snap Mode', sub:'Photo to explanation', panel:'snap', shortcut:''},
 {icon:'', name:'Drug Checker', sub:'Interactions & dosage', panel:'drugchecker', shortcut:''},
 {icon:'', name:'Calculators', sub:'BMI, GFR, CHADS, CURB', panel:'calculator', shortcut:''},
 {icon:'', name:'My Library', sub:'Saved notes & summaries', panel:'library', shortcut:''},
 {icon:'', name:'Settings', sub:'Account & preferences', panel:'settings', shortcut:''},
];

var cmdSelectedIdx = 0;

function openCmdPalette() {
 document.getElementById('cmdOverlay').classList.add('on');
 document.getElementById('cmdInput').value = '';
 cmdSearch('');
 setTimeout(function(){ document.getElementById('cmdInput').focus(); }, 100);
}
function closeCmdPalette() { document.getElementById('cmdOverlay').classList.remove('on'); }

function cmdSearch(query) {
 var results = document.getElementById('cmdResults');
 var q = query.toLowerCase();
 var filtered = q ? CMD_ITEMS.filter(function(i){ return i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q); }) : CMD_ITEMS;
 cmdSelectedIdx = 0;
 var html = (q ? '' : '<div class="cmd-section">All Features</div>');
 filtered.forEach(function(item, i) {
 html += '<div class="cmd-item' + (i===0?' selected':'') + '" onclick="cmdGo(this.getAttribute(\"data-p\")" data-p="'+item.panel+'" data-idx="'+i+'">';
 html += '<div class="cmd-item-icon">'+item.icon+'</div>';
 html += '<div><div class="cmd-item-name">'+item.name+'</div><div class="cmd-item-sub">'+item.sub+'</div></div>';
 if(item.shortcut) html += '<span class="cmd-shortcut">'+item.shortcut+'</span>';
 html += '</div>';
 });
 results.innerHTML = html;
}

function cmdGo(panel) { closeCmdPalette(); goPanel(panel); }

function cmdKeyNav(e) {
 var items = document.querySelectorAll('.cmd-item');
 if(e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIdx = Math.min(cmdSelectedIdx+1, items.length-1); }
 else if(e.key === 'ArrowUp') { e.preventDefault(); cmdSelectedIdx = Math.max(cmdSelectedIdx-1, 0); }
 else if(e.key === 'Enter') { if(items[cmdSelectedIdx]) items[cmdSelectedIdx].click(); return; }
 else if(e.key === 'Escape') { closeCmdPalette(); return; }
 items.forEach(function(item, i){ item.classList.toggle('selected', i===cmdSelectedIdx); });
 if(items[cmdSelectedIdx]) items[cmdSelectedIdx].scrollIntoView({block:'nearest'});
}

// Keyboard shortcut: Ctrl+K or Cmd+K
document.addEventListener('keydown', function(e) {
 if((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmdPalette(); }
 if(e.key === 'Escape') { closeCmdPalette(); closeShareCard(); }
});

// ════════════════════════════════════════════════
// TODAY DASHBOARD
// ════════════════════════════════════════════════
function updateTodayCard() {
 var hour = new Date().getHours();
 var greeting = hour < 12 ? 'Good morning! ' : hour < 17 ? 'Good afternoon! ' : 'Good evening! ';
 var greetEl = document.getElementById('todayGreeting');
 if(greetEl) greetEl.textContent = greeting + ' ' + (sName ? 'Dr. ' + sName.split(' ')[0] : '');

 var today = new Date().toISOString().split('T')[0];
 var dueCards = srsQueue.filter(function(c){ return c.nextReviewDate <= today && c.correctStreak < 5; }).length;
 var mastered = srsQueue.filter(function(c){ return c.correctStreak >= 5; }).length;
 var todayXPGained = parseInt(localStorage.getItem('aid_today_xp_' + today) || '0');

 var dueEl = document.getElementById('todayDueCards'); if(dueEl) dueEl.textContent = dueCards;
 var mastEl = document.getElementById('todayMastered'); if(mastEl) mastEl.textContent = mastered;
 var xpEl = document.getElementById('todayXPGoal'); if(xpEl) xpEl.textContent = todayXPGained;
 var xpTopEl = document.getElementById('todayXP'); if(xpTopEl) xpTopEl.textContent = todayXPGained;
 var xpFill = document.getElementById('todayXPFill'); if(xpFill) xpFill.style.width = Math.min(100, todayXPGained) + '%';
 var revSub = document.getElementById('todayReviewSub'); if(revSub) revSub.textContent = dueCards + ' due today';
 var streakEl = document.getElementById('todayStreakNum'); if(streakEl) streakEl.textContent = streak || 1;
}

function continueLearning() {
 var today = new Date().toISOString().split('T')[0];
 var dueCards = srsQueue.filter(function(c){ return c.nextReviewDate <= today; }).length;
 if(dueCards > 0) goPanel('srs');
 else if(totalCards === 0) goPanel('flash');
 else goPanel('examprep');
}

// Track today's XP separately
var _origUpdateXP = updateXP;
updateXP = function(amount) {
 _origUpdateXP(amount);
 var today = new Date().toISOString().split('T')[0];
 var todayXP = parseInt(localStorage.getItem('aid_today_xp_' + today) || '0');
 localStorage.setItem('aid_today_xp_' + today, todayXP + amount);
 updateTodayCard();
 checkMemeAchievements();
};

// ════════════════════════════════════════════════
// BOTTOM NAV SYNC
// ════════════════════════════════════════════════
var _origGoPanel3 = goPanel;
goPanel = function(id) {
 _origGoPanel3(id);
 // Sync bottom nav
 document.querySelectorAll('.bnav-btn').forEach(function(b){ b.classList.remove('on'); });
 var bnav = document.getElementById('bnav-' + id);
 if(bnav) bnav.classList.add('on');
 // Update today card when on dashboard
 if(id === 'dash') updateTodayCard();
};

// ════════════════════════════════════════════════
// LIVE LANDING COUNTERS
// ════════════════════════════════════════════════
function animateLandingCounters() {
 var studying = document.getElementById('lpStudying');
 var cards = document.getElementById('lpCards');
 var users = document.getElementById('lpUsers');
 if(!studying) return;
 setInterval(function(){
 var base = 5 + Math.floor(Math.random()*6);
 studying.textContent = base;
 var c2 = parseInt((cards||{}).textContent||'847') + Math.floor(Math.random()*2);
 if(cards) cards.textContent = c2.toLocaleString();
 }, 3000);
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════
setTimeout(function(){
 updateTodayCard();
 animateLandingCounters();
 checkMemeAchievements();
 // Add share button to topbar
 var topbar = document.querySelector('.topbar-right');
 if(topbar && !document.getElementById('shareBtn')) {
 var shareBtn = document.createElement('button');
 shareBtn.id = 'shareBtn';
 shareBtn.onclick = openShareCard;
 shareBtn.title = 'Share your stats';
 shareBtn.style.cssText = 'background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);color:var(--p-lite);width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;font-family:var(--f)';
 shareBtn.innerHTML = '<i data-lucide="share-2" style="width:16px;height:16px"></i>';
 topbar.insertBefore(shareBtn, topbar.firstChild);
 if(typeof lucide !== 'undefined') lucide.createIcons();
 }
 // Add Ctrl+K hint to sidebar
 var sidebar = document.querySelector('.sidebar');
 if(sidebar && !document.getElementById('cmdHint')) {
 var hint = document.createElement('div');
 hint.id = 'cmdHint';
 hint.style.cssText = 'font-size:9px;color:var(--tx3);text-align:center;padding:4px;cursor:pointer;margin-top:auto';
 hint.innerHTML = '<kbd style="font-size:9px;background:rgba(255,255,255,.05);border:1px solid var(--bd);padding:1px 4px;border-radius:3px">⌘K</kbd>';
 hint.onclick = openCmdPalette;
 sidebar.appendChild(hint);
 }
}, 800);

