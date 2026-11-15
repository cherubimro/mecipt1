// SPDX-License-Identifier: AGPL-3.0-or-later
// Rama modernă a paginii: bara de sticlă (cartonașul programului, „Mai multe”), scena cu camera
// care se apropie de o parte a pupitrului, eticheta de stare, filele de pe telefon și vederea Live.
// Pupitrul însuși rămâne desenat de panel.js și pornit de app.js; aici nu se atinge mașina decât
// prin funcțiile primite.

import { ZONES, CHIPS, VIEWBOX, zoneById, pageCount, regionRect, fitCamera, cameraTransform, miniWindow } from './camera.js';
import { decodeLive } from './live.js';

const $ = (id) => document.getElementById(id);
const PHONE = '(max-width: 760px)';
const STRIP_GROUPS = ['M', 'RI', 'R1', 'RA', 'RAI'];
const STRIP_VIEWBOX = [60, 580, 1950, 560];
const TABS = ['desk', 'live', 'typewriter', 'atelier', 'learn'];

// Poziția unui element față de un strămoș, în pixelii aranjării (fără transformări).
function offsetWithin(el, ancestor) {
  let x = 0, y = 0, n = el;
  while (n && n !== ancestor) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
}

// cb = { T, lang, press, sheet, setView, viewOf, setMode, modeOf, startTour, explainMode }
export function setupShell(cb) {
  const T = cb.T;
  const phone = () => (globalThis.matchMedia ? matchMedia(PHONE).matches : false);
  const stage = $('stage'), camera = $('camera'), panels = $('panels'), desk = $('desk');
  let zoneId = 'all', page = 0, tab = 'desk', running = false, halted = false;

  // ---- foile care se deschid din bară ----
  const pops = [[$('program-card'), $('program-sheet')], [$('more'), $('more-menu')]];
  function closePops(except) {
    for (const [btn, pop] of pops) {
      if (pop === except) continue;
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  }
  for (const [btn, pop] of pops) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = pop.hidden;
      closePops(open ? pop : null);
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    // foaia se închide singură după ce vizitatorul a ales ceva din ea; un clic pe fundalul ei nu o închide
    pop.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) closePops(null); else e.stopPropagation();
    });
    pop.addEventListener('change', () => closePops(null));
  }
  document.addEventListener('click', () => closePops(null));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePops(null); });

  // ---- mutarea comenzilor între bară și „Mai multe”, după lățimea ecranului ----
  const MOVABLE = ['mode', 'speed', 'step', 'explain', 'doc-link', 'view-3d', 'sound', 'lang', 'bar-extra'];
  const home = new Map();
  for (const id of [...MOVABLE, 'statebar']) {
    const el = $(id);
    if (el) home.set(id, [el.parentNode, el.nextSibling]);
  }
  function relocate(isPhone) {
    const slot = $('more-slot');
    for (const id of MOVABLE) {
      const el = $(id);
      if (!el) continue;
      if (isPhone) { if (el.parentNode !== slot) slot.append(el); }
      else { const [p, next] = home.get(id); if (el.parentNode !== p) p.insertBefore(el, next); }
    }
    const sb = $('statebar');
    if (isPhone) { if (sb.parentNode !== document.body) document.body.insertBefore(sb, $('topbar').nextSibling); }
    else { const [p, next] = home.get('statebar'); if (sb.parentNode !== p) p.insertBefore(sb, next); }
  }

  // ---- zonele camerei ----
  const zoneList = () => (phone() ? CHIPS : ZONES);
  const zoneLabel = (id) => (phone() ? T().chips[id] : T().zones[id]) || id;
  function buildZones() {
    const box = $('zones');
    const want = zoneList().map((z) => z.id).join();
    if (box.dataset.list !== want) {
      box.dataset.list = want;
      box.textContent = '';
      for (const z of zoneList()) {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = `zone-${z.id}`;
        b.dataset.zone = z.id;
        box.append(b);
      }
    }
    box.setAttribute('aria-label', phone() ? T().chips.label : T().zones.label);
    for (const b of box.children) {
      b.textContent = zoneLabel(b.dataset.zone);
      b.setAttribute('aria-pressed', String(b.dataset.zone === zoneId));
    }
  }
  $('zones').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-zone]');
    if (b) setZone(b.dataset.zone);
  });
  $('page-prev').addEventListener('click', () => turnPage(-1));
  $('page-next').addEventListener('click', () => turnPage(1));

  function turnPage(d) {
    const z = zoneById(zoneList(), zoneId), n = pageCount(z);
    page = (page + d + n) % n;
    applyCamera();
    paintZones();
  }

  function setZone(id, { keepPage = false } = {}) {
    const z = zoneById(zoneList(), id);
    zoneId = z.id;
    if (!keepPage) page = 0;
    if (cb.viewOf() !== z.view) cb.setView(z.view);
    applyCamera();
    paintZones();
  }

  function paintZones() {
    const z = zoneById(zoneList(), zoneId), n = pageCount(z);
    desk.dataset.zone = zoneId === 'all' ? 'all' : 'near';
    for (const b of $('zones').children) b.setAttribute('aria-pressed', String(b.dataset.zone === zoneId));
    const paged = phone() && n > 1;
    $('pager').hidden = !paged;
    if (paged) $('page-label').textContent = (T().pages[(z.pageNames || [])[page]] || '');
    $('mini').hidden = !phone();
    $('statebar').querySelector('.hint').textContent = running ? T().runningNote
      : (T().zoneNote[zoneId] || T().hint);
  }

  // Caseta în care încape camera, în pixelii scenei. În panoramă pupitrul nu umple scena de la margine
  // la margine: stă pe vreo 84 % din lățime, ceva mai sus de mijloc, cu masa și aer sub el (ca în schiță).
  // Apropiată de o zonă, camera umple scena, că acolo contează mărimea inscripțiilor.
  function fitBox(w, h, isPhone, wide) {
    if (isPhone) return { x0: 6, y0: 96, x1: w - 6, y1: h - 62 };
    if (!wide) return { x0: 22, y0: 18, x1: w - 22, y1: h - 76 };
    const px = Math.max(28, w * 0.08);
    return { x0: px, y0: h * 0.06, x1: w - px, y1: h * 0.64 };
  }

  function applyCamera() {
    if (!stage.offsetParent && stage.hidden) return;
    const isPhone = phone();
    const view = cb.viewOf();
    const z = zoneById(zoneList(), zoneId);
    const singlePanel = view !== 'all';
    // pe ecran lat, un singur panou se vede întreg, la lățimea scenei (ca înainte de camere):
    // scena crește cât îi trebuie panoului
    if (!isPhone && singlePanel) {
      const vb = VIEWBOX[view] || VIEWBOX.right;
      const boxW = Math.max(120, stage.clientWidth - 44);
      stage.style.height = `${Math.round(boxW * vb[3] / vb[2] + 94)}px`;
    } else {
      stage.style.height = '';
    }
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    const box = fitBox(w, h, isPhone, zoneId === 'all' && view === 'all');
    const originX = w / 2;
    // regiunea cerută, dacă panoul ei se vede; altfel tot ce se vede din pupitru
    let rect = null;
    const slotId = { left: 'panel-left', middle: 'panel-middle', right: 'panel-right' }[z.panel];
    const slot = slotId && $(slotId);
    if (z.pages && slot && slot.offsetWidth) {
      rect = regionRect(offsetWithin(slot, panels), z.panel, z.pages[Math.min(page, z.pages.length - 1)]);
    } else {
      rect = { x0: 0, y0: 0, x1: panels.offsetWidth, y1: panels.offsetHeight };
    }
    const cam = fitCamera(rect, box, { originX });
    camera.style.transform = cameraTransform(cam);
    if (isPhone) {
      const win = miniWindow(cam, box, panels.offsetWidth || 1, originX);
      const i = $('mini').querySelector('i');
      i.style.left = `${(4 + win.left * 0.94).toFixed(1)}px`;
      i.style.width = `${Math.max(6, win.width * 0.94).toFixed(1)}px`;
    }
  }

  // Vederea s-a schimbat din altă parte (turul, select-ul „Vedere”): camera o urmează.
  function onView(name) {
    const list = zoneList();
    const z = zoneById(list, zoneId);
    if (z.view !== name) {
      const fit = list.find((x) => x.view === name && !x.pages) || list.find((x) => x.view === name);
      zoneId = fit ? fit.id : zoneId;
      page = 0;
    }
    applyCamera();
    paintZones();
  }

  // ---- fereastra mică spre registre (vederea Live) ----
  let stripLamps = [];
  function buildStrip(positions, colors) {
    const [vx, vy, vw, vh] = STRIP_VIEWBOX;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" aria-hidden="true">`,
      `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#e2dcc2"/>`];
    const ids = [];
    for (const g of STRIP_GROUPS) {
      const grp = positions.right[g];
      if (!grp) continue;
      (grp.lamps || []).forEach(([x, y], i) => {
        const red = ((colors[g] || [])[i] || 'red') === 'red';
        parts.push(`<circle cx="${x}" cy="${y}" r="20" fill="#2c2b26"/>`);
        parts.push(`<circle class="sl" cx="${x}" cy="${y}" r="20" fill="${red ? '#ff6a4a' : '#7de05a'}" opacity="0"/>`);
        ids.push(`lamp-${g}-${i}`);
      });
    }
    parts.push('</svg>');
    $('live-strip-pan').innerHTML = parts.join('');
    const circles = [...$('live-strip-pan').querySelectorAll('.sl')];
    stripLamps = ids.map((id, i) => ({ id, el: circles[i], shown: -1 }));
  }

  // ---- filele de pe telefon ----
  function setTab(id) {
    if (!TABS.includes(id)) return;
    tab = id;
    document.body.dataset.tab = id;
    for (const t of TABS) $(`tab-${t}`).setAttribute('aria-current', String(t === id));
    $('copy-listing').hidden = !(id === 'typewriter' && phone());
    if (id === 'atelier' && cb.modeOf() === 'console') cb.setMode('atelier');
    if (id === 'desk' && cb.modeOf() === 'atelier') cb.setMode('console');
    if (id === 'desk') applyCamera();
    paintNowbar();
    scrollTo(0, 0);
  }
  for (const t of TABS) $(`tab-${t}`).addEventListener('click', () => setTab(t));
  $('live-strip').addEventListener('click', () => { setTab('desk'); setZone('registers'); });
  $('live-peek').addEventListener('click', () => setTab('typewriter'));
  $('nowbar-open').addEventListener('click', () => setTab('live'));
  $('live-decoded').addEventListener('click', () => setLiveMode(false));
  $('live-lamps').addEventListener('click', () => setLiveMode(true));
  function setLiveMode(on) {
    $('live-card').classList.toggle('lamps', on);
    $('live-decoded').setAttribute('aria-pressed', String(!on));
    $('live-lamps').setAttribute('aria-pressed', String(on));
  }
  function paintNowbar() {
    $('nowbar').hidden = !(phone() && tab !== 'live' && running);
  }

  $('copy-listing').addEventListener('click', async () => {
    const text = cb.sheet().lines().join('\n');
    try {
      await navigator.clipboard.writeText(text);
      $('copy-listing-label').textContent = T().copyDone;
      setTimeout(() => { $('copy-listing-label').textContent = T().copyListing; }, 1600);
    } catch { /* browserul nu dă voie: tipăritura rămâne de selectat cu degetul */ }
  });

  $('learn-tour').addEventListener('click', () => { setTab('desk'); cb.startTour(); });
  $('learn-explain').addEventListener('click', () => { setTab('desk'); cb.explainMode(true); });

  // ---- cartonașul programului ----
  function setProgram(title, parts) {
    $('program-title').textContent = title;
    $('program-sum').textContent = parts.join(' · ');
  }

  // ---- textele ----
  function paintRun() {
    const S = T(), name = running ? S.pause : halted ? S.runAgain : S.run;
    $('run-label').textContent = name;
    $('run').setAttribute('aria-label', name);
    $('run').title = name;
    $('nowbar-run').setAttribute('aria-label', name);
  }

  function setTexts() {
    const S = T();
    paintRun();
    $('program-card').setAttribute('aria-label', S.programPick);
    $('program-label').textContent = S.program;
    $('more').setAttribute('aria-label', S.moreLabel);
    $('more').title = S.more;
    $('more-label').textContent = S.more;
    $('step').setAttribute('aria-label', S.stepOne);
    $('step').title = S.stepOne;
    $('page-prev').setAttribute('aria-label', S.pagePrev);
    $('page-next').setAttribute('aria-label', S.pageNext);
    $('live-mode-label').textContent = S.live.modeLabel;
    $('live-decoded').textContent = S.live.decoded;
    $('live-lamps').textContent = S.live.lamps;
    $('live-strip').setAttribute('aria-label', S.live.stripLabel);
    $('live-strip-label').textContent = S.live.strip;
    $('live-title').textContent = S.tabs.live;
    $('live-rai-lab').innerHTML = '';
    $('live-rai-lab').append(S.live.rai, Object.assign(document.createElement('b'), { textContent: 'RAI' }));
    $('live-ri-lab').innerHTML = '';
    $('live-ri-lab').append(S.live.ri, Object.assign(document.createElement('b'), { textContent: 'RI' }));
    $('live-m-lab').innerHTML = '';
    $('live-m-lab').append(S.live.m, Object.assign(document.createElement('b'), { textContent: 'M' }));
    $('live-half-1-lab').textContent = S.live.half(1);
    $('live-half-2-lab').textContent = S.live.half(2);
    $('live-m-cap').textContent = S.live.mNote;
    $('live-uop-lab').textContent = S.live.uopLab;
    $('live-peek-title').textContent = S.live.peek;
    $('nowbar-open').setAttribute('aria-label', S.live.open);
    $('copy-listing-label').textContent = S.copyListing;
    $('learn-title').textContent = S.learn.title;
    $('learn-note').textContent = S.learn.note;
    $('learn-tour').querySelector('span').textContent = S.learn.tour;
    $('learn-explain').querySelector('span').textContent = S.learn.explain;
    $('learn-doc').querySelector('span').textContent = S.learn.doc;
    $('phone-tabs').setAttribute('aria-label', S.tabs.label);
    for (const t of TABS) $(`tab-${t}`).querySelector('span').textContent = S.tabs[t];
    buildZones();
    paintZones();
  }

  // ---- un cadru ----
  let lastLive = '';
  function onFrame(snap, lamps, ctx) {
    const isRunning = ctx.mode === 'automat' && !ctx.pulsesOff;
    if (isRunning !== running || !!ctx.halted !== halted) {
      running = isRunning;
      halted = !!ctx.halted;
      document.body.classList.toggle('running', running);
      paintRun();
      paintZones();
      paintNowbar();
    }
    if (!phone()) return;
    for (const l of stripLamps) {
      const b = lamps.get(l.id) ?? 0;
      const v = Math.round(b * 20) / 20;
      if (v !== l.shown) { l.el.setAttribute('opacity', String(v)); l.shown = v; }
    }
    const d = decodeLive(snap.state, ctx);
    const key = `${d.rai.oct}|${d.ri.code}${d.ri.addr}|${d.m.text}|${d.now}|${d.uop.id}|${ctx.lang}`;
    if (key === lastLive) { paintPeek(); return; }
    lastLive = key;
    $('live-rai').textContent = d.rai.oct;
    paintDots($('live-rai-dots'), d.rai.dots);
    paintDots($('live-ri-dots'), d.ri.dots);
    paintDots($('live-m-dots'), d.m.dots);
    for (const half of d.halves) {
      $(`live-half-${half.n}-val`).textContent = half.text;
      $(`live-half-${half.n}`).classList.toggle('now', half.n === d.now);
    }
    $('live-ri-cap').textContent = T().live.riCap(d.ri.code, d.ri.mnemonic, d.ri.addr, d.ri.effect);
    $('live-m').textContent = d.m.text;
    $('live-uop').textContent = d.uop.label || '—';
    $('live-uop-gloss').textContent = d.uop.gloss || '';
    $('nowbar-text').textContent = `${d.rai.oct} · ${d.halves[0].text} · ${d.halves[1].text}`;
    $('live-peek-chip').textContent = T().live.drumAt(d.rai.oct);   // de unde citește tamburul acum
    paintPeek();
  }
  function paintPeek() {
    const lines = cb.sheet().lines();
    const txt = lines.slice(-2).join('\n');
    if ($('live-peek-paper').textContent !== txt) $('live-peek-paper').textContent = txt;
  }
  function paintDots(el, classes) {
    while (el.children.length > classes.length) el.lastChild.remove();
    while (el.children.length < classes.length) el.append(document.createElement('span'));
    classes.forEach((c, i) => { if (el.children[i].className !== c) el.children[i].className = c; });
  }
  function setStatusLine(text) {
    const sub = $('nowbar-sub');
    if (sub.textContent !== text) sub.textContent = text;
  }

  // ---- pornirea ----
  function layout() {
    const isPhone = phone();
    relocate(isPhone);
    buildZones();
    if (isPhone && !document.body.dataset.tab) setTab('desk');
    if (!isPhone) { document.body.removeAttribute('data-tab'); $('copy-listing').hidden = true; }
    const list = zoneList();
    if (!list.some((z) => z.id === zoneId)) zoneId = isPhone ? 'compute' : 'all';
    setZone(zoneId, { keepPage: true });
    paintNowbar();
  }

  return {
    start(positions, colors) {
      buildStrip(positions, colors);
      setLiveMode(false);
      setTexts();
      layout();
      if (phone()) setZone('compute');
      addEventListener('resize', () => { layout(); applyCamera(); }, { passive: true });
      // scena se îngustează și fără redimensionarea ferestrei (panoul de explicații strânge pagina):
      // camera se refigurează, ca pupitrul să rămână în ramă
      if (globalThis.ResizeObserver) {
        let lastW = stage.clientWidth;
        new ResizeObserver(() => {
          if (stage.clientWidth === lastW) return;
          lastW = stage.clientWidth;
          applyCamera();
        }).observe(stage);
      }
    },
    setTexts, onFrame, setProgram, onView, applyCamera, setTab, setStatusLine, layout,
    zone: () => zoneId,
    tab: () => tab,
  };
}
