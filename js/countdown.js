// ── Block countdown (D / H / M / S) ─────────────────────
export function createBlockCountdown(target, container) {
  const dEl = container.querySelector('[data-cd="d"]');
  const hEl = container.querySelector('[data-cd="h"]');
  const mEl = container.querySelector('[data-cd="m"]');
  const sEl = container.querySelector('[data-cd="s"]');

  const update = () => {
    const diff = Math.max(0, new Date(target) - new Date());
    const total = Math.floor(diff / 1000);
    const d = String(Math.floor(total / 86400)).padStart(2, '0');
    const h = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    if (dEl) dEl.textContent = d;
    if (hEl) hEl.textContent = h;
    if (mEl) mEl.textContent = m;
    if (sEl) sEl.textContent = s;
  };
  update();
  const id = setInterval(update, 1000);
  return () => clearInterval(id);
}

// ── Legacy inline countdown (HH:MM:SS) ──────────────────
export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const t = Math.floor(ms / 1000);
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function createCountdown(target, element) {
  const update = () => { element.textContent = formatCountdown(new Date(target) - new Date()); };
  update();
  const id = setInterval(update, 1000);
  return () => clearInterval(id);
}
