// ════════════════════════════════════════
// FRAMER-STYLE ANIMATIONS (vanilla JS)
// ════════════════════════════════════════

// Scroll reveal observer
(function() {
 if(typeof IntersectionObserver === 'undefined') {
 document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('visible'); });
 return;
 }
 var observer = new IntersectionObserver(function(entries) {
 entries.forEach(function(entry) {
 if(entry.isIntersecting) {
 entry.target.classList.add('visible');
 observer.unobserve(entry.target);
 }
 });
 }, {threshold:0, rootMargin:'0px 0px 0px 0px'});

 function observeRevealEls() {
 document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
 observer.observe(el);
 });
 // Safety net: never let content stay permanently invisible
 // (fast/programmatic scrolling can skip past the intersection threshold)
 setTimeout(function() {
 document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
 el.classList.add('visible');
 observer.unobserve(el);
 });
 }, 2500);
 }

 // Add reveal class to key elements
 function addRevealClasses() {
 var selectors = [
 '.today-card', '.dash-stat', '.growth-stat',
 '.habit-card', '.motiv-card', '.countdown-card',
 '.lec-section', '.ep-subj-card', '.mock-exam-card',
 '.lb-item', '.deck-card'
 ];
 selectors.forEach(function(sel) {
 document.querySelectorAll(sel).forEach(function(el, i) {
 el.classList.add('reveal');
 el.style.transitionDelay = (i * 0.05) + 's';
 });
 });
 observeRevealEls();
 }

 // Run on panel change (hooked safely below, outside the override chain)
 addRevealClasses();
})();

// XP float animation on earn
function showXPFloat(amount, x, y) {
 var el = document.createElement('div');
 el.className = 'xp-float';
 el.textContent = '+' + amount + ' XP ';
 el.style.left = (x || window.innerWidth/2 - 30) + 'px';
 el.style.top = (y || window.innerHeight/2) + 'px';
 document.body.appendChild(el);
 setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 950);
}

// Intercept XP updates to show float (safe)
setTimeout(function() {
 if(typeof window.updateXP === 'function') {
  var _orig = window.updateXP;
  window.updateXP = function(amount) {
   _orig(amount);
   if(amount > 0) showXPFloat(amount);
  };
 }
}, 1200);

// Animated number counter
function animateCounter(el, target, duration) {
 if(!el) return;
 var start = parseInt(el.textContent) || 0;
 var range = target - start;
 var startTime = null;
 duration = duration || 800;
 function step(ts) {
 if(!startTime) startTime = ts;
 var progress = Math.min((ts - startTime) / duration, 1);
 var ease = 1 - Math.pow(1 - progress, 3);
 el.textContent = Math.round(start + range * ease);
 if(progress < 1) requestAnimationFrame(step);
 else el.classList.add('count-up');
 }
 requestAnimationFrame(step);
}

// Ripple effect on buttons
document.addEventListener('click', function(e) {
 var btn = e.target.closest('button, .today-action, .nibble-topic-btn');
 if(!btn || btn.classList.contains('no-ripple')) return;
 var ripple = document.createElement('span');
 var rect = btn.getBoundingClientRect();
 var size = Math.max(rect.width, rect.height);
 ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,.15);width:'+size+'px;height:'+size+'px;left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px;transform:scale(0);animation:rippleAnim .5s ease;pointer-events:none';
 btn.style.position = btn.style.position || 'relative';
 btn.style.overflow = 'hidden';
 btn.appendChild(ripple);
 setTimeout(function(){ if(ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 500);
});

// Add ripple keyframe
(function(){
 var style = document.createElement('style');
 style.textContent = '@keyframes rippleAnim{to{transform:scale(2.5);opacity:0}}';
 document.head.appendChild(style);
})();

