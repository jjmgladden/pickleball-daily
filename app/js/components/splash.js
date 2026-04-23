// splash.js — once-per-session intro animation.
//
// Gated by sessionStorage ('pkb-splash-shown'), so it shows on a fresh tab only.
// Honors prefers-reduced-motion: no animation, just a brief 400ms flash-and-fade.
// Non-blocking: returns a Promise so app.js can render in parallel.

const KEY = 'pkb-splash-shown';
const VISIBLE_MS = 2200;
const FADE_MS = 300;

export function showSplashIfFirstVisit() {
  let shouldShow = true;
  try { shouldShow = !sessionStorage.getItem(KEY); } catch {}
  if (!shouldShow) return Promise.resolve();

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'splash';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Loading Pickleball Daily');
  el.innerHTML =
    '<div class="splash-inner">' +
      '<img class="splash-icon" src="icons/icon-192.png" alt="" width="96" height="96">' +
      '<div class="splash-title">Ozark Joe\u2019s Pickleball Daily</div>' +
      '<div class="splash-tag">PPA \u00b7 MLP \u00b7 DUPR \u00b7 USAP</div>' +
    '</div>';

  document.body.appendChild(el);
  try { sessionStorage.setItem(KEY, '1'); } catch {}

  // Force reflow so the .splash--visible transition triggers from the initial state.
  void el.offsetWidth;
  el.classList.add('splash--visible');

  const dismiss = () => {
    el.classList.add('splash--fading');
    setTimeout(() => el.remove(), FADE_MS + 50);
  };

  el.addEventListener('click', dismiss, { once: true });

  const visibleFor = reduced ? 400 : VISIBLE_MS;
  return new Promise(resolve => {
    setTimeout(() => {
      dismiss();
      setTimeout(resolve, FADE_MS);
    }, visibleFor);
  });
}
