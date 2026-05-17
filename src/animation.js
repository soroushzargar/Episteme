export function triggerAnimation(className = "stage-change", duration = 420) {
  const el = document.documentElement;
  if (!el) return;
  el.classList.remove(className);
  // Force reflow
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration + 40);
}

export function animateElementOnce(selector, className = "anim-fade-up", duration = 340) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration + 40);
}
