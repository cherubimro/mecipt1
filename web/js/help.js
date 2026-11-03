// SPDX-License-Identifier: AGPL-3.0-or-later
// Ajutorul: id-ul unui element al pupitrului → intrarea lui din web/data/help/<limbă>.json.

// Ordinea căutării: id-ul exact, apoi grupul (lamp-<grup>, switch-<grup>), apoi familia (meter, toggle).
export function helpKey(targetId, help) {
  const e = help.entries;
  if (targetId in e) return targetId;
  const g = /^(lamp|switch)-([A-Za-z0-9]+)-\d+$/.exec(targetId);
  if (g && `${g[1]}-${g[2]}` in e) return `${g[1]}-${g[2]}`;
  const f = /^(meter|toggle)-\d+$/.exec(targetId);
  if (f && f[1] in e) return f[1];
  return null;
}

export function helpFor(targetId, help) {
  const k = helpKey(targetId, help);
  if (!k) throw new Error(`fără explicație pentru ${targetId}`);
  return { key: k, ...help.entries[k] };
}
