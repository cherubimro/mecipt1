// SPDX-License-Identifier: AGPL-3.0-or-later
// Alegerea limbii: ?lang= din adresă, apoi limba ținută minte, apoi româna.
export const LANGS = ['ro', 'en'];
const KEY = 'mecipt.lang';

export function pickLang(search, storage) {
  try {
    const q = new URLSearchParams(search || '').get('lang');
    if (LANGS.includes(q)) return q;
  } catch { /* adresă ciudată: mai departe */ }
  try {
    const v = storage ? storage.getItem(KEY) : null;
    if (LANGS.includes(v)) return v;
  } catch { /* stocare blocată (fereastră privată) */ }
  return 'ro';
}

export function saveLang(lang, storage) {
  try { if (storage) storage.setItem(KEY, lang); } catch { /* nu se poate ține minte: nu e grav */ }
}
