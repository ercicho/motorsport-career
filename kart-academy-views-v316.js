// Karting Academy shared regulations view, v3.1.6.
// Read-only presentation of the same raceRegulations object used by the Calendar.
(function () {
  'use strict';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const format = (plan) => {
    const r = kartReg315For(plan);
    const fields = [
      ['Distanza', r.laps + ' giri'],
      ['Prove libere', r.practiceMinutes + ' min'],
      ['Qualifiche', r.qualifyingMinutes + ' min'],
      ['Danni', {Off:'Disattivati',Light:'Leggeri',Heavy:'Pesanti'}[r.damage] || r.damage],
      ['Usura gomme', r.tyreWear],
      ['Carburante', r.fuelUse],
      ['Penalità', r.penalties ? 'Attive' : 'Disattivate'],
      ['Partenza', {Standing:'Da fermo',Rolling:'Lanciata'}[r.start] || r.start],
      ['Meteo', {Default:'Predefinito',Clear:'Sereno',Variable:'Variabile'}[r.weather] || r.weather],
      ['IA', r.ai]
    ];
    return `<div class="kart316-grid">${fields.map(([key,value]) =>
      `<div><small>${escapeHTML(key)}</small><strong>${escapeHTML(value)}</strong></div>`).join('')}</div>` +
      (r.notes ? `<p class="helper">Note: ${escapeHTML(r.notes)}</p>` : '') +
      `<p class="helper">Impostazioni suggerite: verifica le opzioni disponibili in GT7.</p>`;
  };
  const style = document.createElement('style');
  style.textContent = `
    .kart316-card{margin:12px 0;padding:16px;border:1px solid #465261;border-radius:12px;background:#151c26}
    .kart316-card h3{margin:0 0 8px}
    .kart316-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;margin:12px 0}
    .kart316-grid>div{padding:8px;background:#202a36;border-radius:7px}
    .kart316-grid small{display:block;color:#b2c2d1;font-size:11px}
    .kart316-grid strong{display:block;margin-top:3px;font-size:13px}
    .kart316-card button{margin:5px 6px 0 0}
  `;
  document.head.appendChild(style);

  function academy() {
    const host = document.getElementById('career20-kart') || document.getElementById('road18Content');
    if (!host) return;
    let box = document.getElementById('kart316-academy');
    if (!box) {
      box = document.createElement('div');
      box.id = 'kart316-academy';
      box.className = 'card';
      host.appendChild(box);
    }
    const plans = state.plans.filter(p => p.road18Kart);
    const html = '<h2>Karting Academy · Regolamenti delle sessioni</h2>' +
      (plans.length ? plans.map(p => `
        <article class="kart316-card">
          <h3>${escapeHTML(p.event)}</h3>
          <p class="helper">${escapeHTML(p.track)} · ${escapeHTML(p.car || 'Racing Kart')} · ${escapeHTML(p.status || 'Da disputare')}</p>
          ${format(p)}
          <button type="button" data-kart316-open="${escapeHTML(p.id)}">Apri Race Briefing</button>
          ${p.status !== 'Disputato' ? `<button type="button" data-kart-reg315="${escapeHTML(p.id)}">Modifica regolamento</button>` : '<small>Sessione completata · sola lettura</small>'}
        </article>`).join('') : '<p class="helper">Pianifica le sessioni Karting Academy per visualizzare i regolamenti.</p>');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  function briefing() {
    const host = document.getElementById('rwBriefStage');
    if (!host || host.hidden) return;
    const plan = state.plans.find(p => p.id === window.pendingPlanId);
    let box = document.getElementById('kart316-briefing');
    if (!plan?.road18Kart) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('section');
      box.id = 'kart316-briefing';
      box.className = 'kart316-card';
      host.appendChild(box);
    }
    const html = `<h3>Regolamento · ${escapeHTML(plan.event)}</h3>` +
      `<p class="helper">${escapeHTML(plan.track)} · ${escapeHTML(plan.car || 'Racing Kart')}</p>` +
      format(plan) +
      (plan.status !== 'Disputato' ? `<button type="button" data-kart-reg315="${escapeHTML(plan.id)}">Modifica regolamento</button>` : '');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  function update() { academy(); briefing(); }
  const previousRender = render;
  render = function (...args) {
    const result = previousRender.apply(this, args);
    update();
    return result;
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-kart316-open]');
    if (!button) return;
    const plan = state.plans.find(p => p.id === button.dataset.kart316Open);
    if (!plan) return;
    const index = state.plans.indexOf(plan);
    if (plan.status === 'Disputato') {
      goToPage('calendar');
      return;
    }
    recordPlanned(index);
    queueMicrotask(update);
  });
  // Race Weekend stages can change without calling the main render().
  const stage = document.getElementById('rwBriefStage');
  if (stage) {
    const observer = new MutationObserver(() => {
      // Only inspect the existing stage; update() is idempotent.
      queueMicrotask(briefing);
    });
    observer.observe(stage, {attributes:true,attributeFilter:['hidden']});
  }
  update();
})();
