import { minutesToClock } from '../systems/sun.js';
import { formatPower } from '../systems/power.js';

export function bindPanel(callbacks) {
  const panel = document.getElementById('control-panel');
  const showBtn = document.getElementById('btn-show-panel');
  const hideBtn = document.getElementById('btn-hide-panel');
  const timeSlider = document.getElementById('time-slider');
  const timeDisplay = document.getElementById('time-display');
  const powerValue = document.getElementById('power-value');
  const powerFill = document.getElementById('power-fill');
  const petalAngle = document.getElementById('petal-angle');
  const presets = document.getElementById('view-presets');
  const exportWhite = document.getElementById('btn-export-white');
  const exportTransparent = document.getElementById('btn-export-transparent');
  const app = document.getElementById('app');

  function setPanelVisible(visible) {
    panel.hidden = !visible;
    showBtn.hidden = visible;
    app.classList.toggle('ui-hidden', !visible);
    // Keep brand/footer when panel shown; when hidden for screenshot, hide all chrome
    if (!visible) {
      app.classList.add('ui-hidden');
    } else {
      app.classList.remove('ui-hidden');
    }
  }

  hideBtn.addEventListener('click', () => setPanelVisible(false));
  showBtn.addEventListener('click', () => setPanelVisible(true));

  timeSlider.addEventListener('input', () => {
    const minutes = Number(timeSlider.value);
    timeDisplay.textContent = minutesToClock(minutes);
    timeSlider.setAttribute('aria-valuetext', timeDisplay.textContent);
    callbacks.onTimeChange?.(minutes);
  });

  presets.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    presets.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    callbacks.onViewChange?.(btn.dataset.view);
  });

  exportWhite.addEventListener('click', () => callbacks.onExport?.({ transparent: false }));
  exportTransparent.addEventListener('click', () => callbacks.onExport?.({ transparent: true }));

  function updatePower(kw, alignment, peak = 186) {
    powerValue.textContent = formatPower(kw);
    powerFill.style.width = `${Math.min(100, (kw / peak) * 100)}%`;
    petalAngle.textContent = `花瓣平均对齐 ${(alignment * 100).toFixed(0)}% · 实时追光`;
  }

  // Initialize display
  timeDisplay.textContent = minutesToClock(Number(timeSlider.value));

  return {
    getMinutes: () => Number(timeSlider.value),
    updatePower,
    setPanelVisible,
  };
}
