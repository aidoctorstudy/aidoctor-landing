
try {
var fbApp = firebase.initializeApp({
 apiKey: "AIzaSyCqnicOyn_YdfWTBglIc06TdTQDQrJgy5o",
 authDomain: "ai-doctor-study.firebaseapp.com",
 projectId: "ai-doctor-study",
 storageBucket: "ai-doctor-study.firebasestorage.app",
 messagingSenderId: "311598733090",
 appId: "1:311598733090:web:6bf2d25b74f6de2df4b77b",
 measurementId: "G-3XPNFZYGN5"
});
var fbAuth = firebase.auth();
var gProvider = new firebase.auth.GoogleAuthProvider();

// Handle redirect result when user comes back from Google OAuth
firebase.auth().getRedirectResult().then(function(result) {
  if (result && result.user) {
    var user = result.user;
    var savedName = localStorage.getItem('aid_name_' + user.uid);
    var savedYear = localStorage.getItem('aid_year_' + user.uid);
    if(savedName && savedYear) {
      sName = savedName; sYear = savedYear; sExam = localStorage.getItem('aid_exam_' + user.uid) || 'MBBS';
      enterMedApp();
    } else {
      sName = user.displayName || 'Doctor';
      document.getElementById('obName').value = sName;
      enterMedApp();
    }
  }
}).catch(function(err) {
  console.log('Redirect result error:', err.message);
});

firebase.auth().onAuthStateChanged(function(user) {
 if(user && !sName) {
 var savedName = localStorage.getItem('aid_name_' + user.uid);
 var savedYear = localStorage.getItem('aid_year_' + user.uid);
 var savedExam = localStorage.getItem('aid_exam_' + user.uid);
 if(savedName && savedYear) {
 sName = savedName; sYear = savedYear; sExam = savedExam || 'MBBS';
 enterMedApp();
 } else {
 document.getElementById('obName').value = user.displayName || '';
 goTo('pg-onboard');
 }
 }
});
} catch(fbInitErr) {
 console.error('Firebase failed to initialize — login will be unavailable, but the rest of the app still works:', fbInitErr);
}


function signInWithGoogle() {
 if(typeof medAuthMode !== 'undefined' && medAuthMode === 'signup') {
  var gAccept = document.getElementById('medAcceptTerms');
  if(gAccept && !gAccept.checked) { showMedAuthErr('Please accept the Terms of Service and Privacy Policy to continue'); return; }
 }
 // Try popup first, fall back to redirect
 fbAuth.signInWithPopup(gProvider)
 .then(function(result) {
 var user = result.user;
 var savedName = localStorage.getItem('aid_name_' + user.uid);
 var savedYear = localStorage.getItem('aid_year_' + user.uid);
 if(savedName && savedYear) {
 sName = savedName; sYear = savedYear; sExam = localStorage.getItem('aid_exam_' + user.uid) || 'MBBS';
 enterMedApp();
 } else {
 sName = user.displayName || 'Doctor';
 document.getElementById('obName').value = sName;
 document.getElementById('medAuthTitle').textContent = 'One more thing! ';
 document.getElementById('medAuthSub').textContent = 'What year are you in?';
 document.getElementById('medNameWrap').style.display = 'none';
 document.getElementById('medEmail').closest('.form-field').style.display = 'none';
 document.getElementById('medPass').closest('.form-field').style.display = 'none';
 document.getElementById('medForgotWrap').style.display = 'none';
 document.getElementById('medAuthToggle').style.display = 'none';
 var _tw = document.getElementById('medTermsWrap'); if(_tw) _tw.style.display = 'none';
 // Hide google button and divider
 var btns = document.querySelectorAll('#pg-onboard button');
 btns[0].style.display = 'none'; // google btn
 document.querySelector('#pg-onboard [style*="flex:1;height:1px"]').closest('div').style.display = 'none';
 var startBtn = document.getElementById('startBtn');
 startBtn.textContent = "Let's Go ";
 startBtn.onclick = function() {
 var y = document.getElementById('obYear').value;
 var ex = document.getElementById('obExam').value;
 if(!y) { showMedAuthErr('Please select your year!'); return; }
 sYear = y; sExam = ex || 'MBBS';
 enterMedApp();
 };
 }
 })
 .catch(function(err) {
 // Popup blocked - use redirect instead
 if(err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
 fbAuth.signInWithRedirect(gProvider);
 } else {
 showMedAuthErr(err.message);
 }
 });
}

function signUpEmail() {
 var n = document.getElementById('obName').value.trim();
 var e = document.getElementById('medEmail').value.trim();
 var p = document.getElementById('medPass').value;
 var y = document.getElementById('obYear').value;
 var ex = document.getElementById('obExam').value;
 if(!n||!e||!p) { showMedAuthErr('Please fill in all fields'); return; }
 if(p.length < 6) { showMedAuthErr('Password must be at least 6 characters'); return; }
 if(!y) { showMedAuthErr('Please select your year of study'); return; }
 var accept = document.getElementById('medAcceptTerms');
 if(accept && !accept.checked) { showMedAuthErr('Please accept the Terms of Service and Privacy Policy to continue'); return; }
 var btn = document.getElementById('startBtn'); btn.disabled=true; btn.textContent='Creating account...';
 sName=n; sYear=y; sExam=ex||'MBBS';
 fbAuth.createUserWithEmailAndPassword(e, p)
 .then(function(cred) { return cred.user.updateProfile({displayName: n}); })
 .then(function() { enterMedApp(); })
 .catch(function(err) { showMedAuthErr(err.message.replace('Firebase: ','')); btn.disabled=false; btn.textContent='Start Studying '; });
}

function loginEmail() {
 var e = document.getElementById('medEmail').value.trim();
 var p = document.getElementById('medPass').value;
 if(!e||!p) { showMedAuthErr('Enter email and password'); return; }
 var btn = document.getElementById('startBtn'); btn.disabled=true; btn.textContent='Logging in...';
 fbAuth.signInWithEmailAndPassword(e, p)
 .then(function() {
 var user = fbAuth.currentUser;
 var savedName = localStorage.getItem('aid_name_' + user.uid);
 var savedYear = localStorage.getItem('aid_year_' + user.uid);
 if(savedName && savedYear) { sName=savedName; sYear=savedYear; sExam=localStorage.getItem('aid_exam_'+user.uid)||'MBBS'; }
 enterMedApp();
 })
 .catch(function(err) { showMedAuthErr('Invalid email or password'); btn.disabled=false; btn.textContent='Log In'; });
}

function forgotPass() {
 var e = document.getElementById('medEmail').value.trim();
 if(!e) { showMedAuthErr('Enter your email above first'); return; }
 fbAuth.sendPasswordResetEmail(e)
 .then(function() { showMedAuthErr('Reset email sent! Check your inbox '); })
 .catch(function() { showMedAuthErr('Could not send reset email'); });
}


function signInEmail() {
 var email = (document.getElementById('medEmail')||{}).value||'';
 var pass = (document.getElementById('medPass')||{}).value||'';
 if(!email||!pass) { showMedAuthErr('Please enter email and password!'); return; }
 fbAuth.signInWithEmailAndPassword(email, pass)
 .then(function(cred) {
 var user = cred.user;
 sName = localStorage.getItem('aid_name_'+user.uid) || user.displayName || email.split('@')[0];
 sYear = localStorage.getItem('aid_year_'+user.uid) || '1';
 sExam = localStorage.getItem('aid_exam_'+user.uid) || 'MBBS';
 enterMedApp();
 }).catch(function(err){ showMedAuthErr(err.message); });
}

function medSignOut() {
 fbAuth.signOut().then(function() { hist=[]; sName=''; goTo('pg-landing'); });
}

function enterMedApp() {
 var user = fbAuth.currentUser;
 if(user) {
 localStorage.setItem('aid_name_' + user.uid, sName);
 localStorage.setItem('aid_year_' + user.uid, sYear);
 localStorage.setItem('aid_exam_' + user.uid, sExam);
 checkProStatus(user.email);
 }
 document.getElementById('sideAvatar').textContent = (sName && sName.length > 0) ? sName[0].toUpperCase() : 'D';
 document.getElementById('dashName').textContent = sName;
 document.getElementById('dashSub').textContent = 'Year ' + (sYear||'1') + ' • ' + (sExam||'MBBS') + ' — Ready to study!';
 document.getElementById('streakCount').textContent = streak;
 updateXP(0); updateBadge();
 goTo('pg-app'); goPanel('dash');
 if(!document.getElementById('chatMsgs').children.length) {
 addAI('Welcome Dr. ' + sName + '! What would you like to study today?', false);
 }
 celebrateGumroadReturnIfNeeded();
}

/**
 * Shared by the two Pro-detection paths below so whichever fires first
 * "wins" the celebration and the other just quietly confirms — without
 * this, a user who both returns via `?pro=activated` *and* has
 * `/api/check-pro` independently confirm Pro on the same visit would see
 * the achievement popup + confetti + XP gain twice.
 */
function hasCelebratedPro() {
 try { return localStorage.getItem('aid_pro_celebrated') === '1'; } catch(e) { return false; }
}
function markProCelebrated() {
 try { localStorage.setItem('aid_pro_celebrated', '1'); } catch(e) {}
}
function celebratePro() {
 markProCelebrated();
 showAchievement('🎉', 'Pro Activated!');
 setTimeout(function(){ updateXP(1000); }, 400);
}

/**
 * Gumroad checkout opens in a new tab (see the Pro modal / pricing card
 * buttons in index.html) — coming back to this tab just re-runs
 * `enterMedApp()` via Firebase's persisted-session `onAuthStateChanged`
 * (same path a returning logged-in user always takes), so this is the one
 * place that needs to know "did they just pay?". The signal is
 * `?pro=activated` on the URL: Gumroad's product has a "redirect to URL
 * after successful purchase" setting (seller dashboard → Content), which
 * must be pointed at `https://aidoctor.study/app?pro=activated` — that
 * configuration lives in the Gumroad account, not in this repo, so it's a
 * one-time manual step outside of what this code can do.
 *
 * Optimistic: flips `isPro` on the URL signal alone rather than waiting on
 * `checkProStatus()`'s webhook-backed round trip (already fired above, in
 * `enterMedApp()`, and will correct this if the two ever disagree) — a
 * paying user shouldn't have to wait to see their own purchase confirmed.
 * Strips the query param immediately via `history.replaceState` so a
 * refresh or back-navigation can't replay the celebration.
 */
function celebrateGumroadReturnIfNeeded() {
 var params = new URLSearchParams(location.search);
 if(params.get('pro') !== 'activated') return;
 history.replaceState(null, '', location.pathname + location.hash);
 isPro = true;
 updateBadge();
 if(!hasCelebratedPro()) celebratePro();
}

/**
 * Asks our own `/api/gumroad-webhook`-fed store (not the old
 * aidoctorstudy.workers.dev worker — same-origin, so no CORS handling
 * needed) whether this email has a Gumroad purchase on file. Runs on every
 * login/session-restore via `enterMedApp()`, so it's also what catches a
 * purchase for a user who closed the Gumroad tab instead of following its
 * redirect back — celebrates the first time it sees Pro for this browser,
 * quietly re-confirms after that (see `hasCelebratedPro`).
 */
async function checkProStatus(email) {
 if(!email) return;
 try {
  var res = await fetch('/api/check-pro?email=' + encodeURIComponent(email));
  var json = await res.json();
  if(json.data && json.data.isPro) {
   var alreadyCelebrated = hasCelebratedPro();
   isPro = true;
   updateBadge();
   if(!alreadyCelebrated) celebratePro();
   else showToast('Pro unlocked!', 'success');
  }
 } catch(e) {
  console.log('Pro check failed:', e.message);
 }
}

function showMedAuthErr(msg) {
 var el = document.getElementById('medAuthErr');
 if(el) { el.textContent = msg; el.style.display = 'block'; }
}

/* When arriving from the marketing site (or any direct visit) while logged out,
   skip the app's own duplicate landing and go straight to the auth form.
   #login opens Log In mode, #signup (default) opens Sign Up mode. */
try {
 firebase.auth().onAuthStateChanged(function(user) {
  if(!user) {
   if(typeof goTo === 'function') goTo('pg-onboard');
   if(location.hash === '#login' && typeof medAuthMode !== 'undefined' && medAuthMode !== 'login' && typeof toggleMedAuth === 'function') {
    toggleMedAuth();
   }
  }
 });
} catch(e) { /* firebase unavailable */ }

var medAuthMode = 'signup';
function toggleMedAuth() {
 medAuthMode = medAuthMode === 'signup' ? 'login' : 'signup';
 var btn = document.getElementById('startBtn');
 var toggle = document.getElementById('medAuthToggle');
 var nameWrap = document.getElementById('medNameWrap');
 var yearWrap = document.getElementById('medYearWrap');
 var examWrap = document.getElementById('medExamWrap');
 var forgot = document.getElementById('medForgotWrap');
 var terms = document.getElementById('medTermsWrap');
 var title = document.getElementById('medAuthTitle');
 var sub = document.getElementById('medAuthSub');
 if(medAuthMode === 'login') {
 title.textContent = 'Welcome back, Doctor! ';
 sub.textContent = 'Log in to continue studying';
 btn.textContent = 'Log In';
 btn.onclick = loginEmail;
 nameWrap.style.display = 'none';
 yearWrap.style.display = 'none';
 examWrap.style.display = 'none';
 forgot.style.display = 'block';
 if(terms) terms.style.display = 'none';
 toggle.innerHTML = 'No account? <a onclick="toggleMedAuth()" style="color:var(--p-lite);font-weight:800;cursor:pointer">Sign Up Free</a>';
 } else {
 title.textContent = 'Welcome, Doctor-in-training! ';
 sub.textContent = 'Tell us about yourself';
 btn.textContent = 'Start Studying ';
 btn.onclick = signUpEmail;
 nameWrap.style.display = 'block';
 yearWrap.style.display = 'block';
 examWrap.style.display = 'block';
 forgot.style.display = 'none';
 if(terms) terms.style.display = 'flex';
 toggle.innerHTML = 'Already have an account? <a onclick="toggleMedAuth()" style="color:var(--p-lite);font-weight:800;cursor:pointer">Log In</a>';
 }
 document.getElementById('medAuthErr').style.display = 'none';
}
