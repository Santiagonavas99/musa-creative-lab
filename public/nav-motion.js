/* MUSA desktop nav hover motion.
   Event delegation survives the existing app's innerHTML-based page renders.
   A single underline travels between non-active navigation items. */
(() => {
  let nav = null;
  let focusedButton = null;
  const getIndicator = () => nav?.querySelector?.(".nav-travel-indicator");
  const isHoverTarget = button => !!(
    button && button.matches?.("button") &&
    !button.classList?.contains("active") &&
    button.getAttribute?.("aria-current") !== "page"
  );
  function hide() {
    getIndicator()?.classList?.remove("is-visible");
  }
  function moveTo(button) {
    const indicator = getIndicator();
    if (!indicator) return;
    if (!isHoverTarget(button)) { hide(); return; }
    const bounds = nav.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    indicator.style.left = Math.round(rect.left - bounds.left + 12) + "px";
    indicator.style.width = Math.max(0,Math.round(rect.width - 24)) + "px";
    indicator.classList.add("is-visible");
  }
  function reset() {
    focusedButton = null;
    hide();
  }
  function mount() {
    const target = document.getElementById("nav");
    if (!target || nav === target) return;
    nav = target;
    nav.classList.add("nav-motion-ready");
    nav.addEventListener("pointerover", event => {
      if (event.pointerType === "touch") return;
      const button = event.target?.closest?.("button");
      if (button && nav.contains(button)) moveTo(button);
    });
    nav.addEventListener("pointerleave", () => {
      if (focusedButton && nav.contains(focusedButton)) moveTo(focusedButton);
      else hide();
    });
    nav.addEventListener("focusin", event => {
      const button = event.target?.closest?.("button");
      focusedButton = button && nav.contains(button) ? button : null;
      moveTo(focusedButton);
    });
    nav.addEventListener("focusout", event => {
      const next = event.relatedTarget?.closest?.("button");
      focusedButton = next && nav.contains(next) ? next : null;
      if (focusedButton) moveTo(focusedButton);
      else hide();
    });
    window.addEventListener?.("resize", () => {
      if (focusedButton?.isConnected) moveTo(focusedButton);
      else hide();
    });
  }
  window.musaNavMotion = { mount, reset };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
