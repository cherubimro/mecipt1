// SPDX-License-Identifier: AGPL-3.0-or-later
// Vederea „Live”: starea mașinii citită în cuvinte, pentru ecranul unui telefon, unde 31 de becuri
// nu se pot citi. Nu atinge DOM-ul, ca să poată fi testată în Node.
//
// Așezarea cuvântului e cea din nucleu (core/isa.h, Lucrarea de laborator 7, p.1):
//   m0 = 0 · m1–m5 codul 2 · m6–m10 codul 1 · m11–m20 adresa 2 · m21–m30 adresa 1,
// iar listingurile din 1962 scriu perechea în ordinea „cod 1 adresă 1  cod 2 adresă 2”.
// Becul cu numărul i al unui registru e bitul m_i, adică bitul (n-1-i) al valorii.

export const M_GAPS = [1, 6, 11, 21];   // după m0, după codul 2, după codul 1, după adresa 2
export const RI_GAPS = [5];             // între cod (5 biți) și adresă (10 biți)

const oct = (v, n) => (v >>> 0).toString(8).padStart(n, '0');

export function bitsMsbFirst(value, n) {
  const v = value >>> 0;
  return Array.from({ length: n }, (_, i) => (v >>> (n - 1 - i)) & 1);
}

export const dotClasses = (bits, color, gaps = []) =>
  bits.map((b, i) => `${color}${b ? ' on' : ''}${gaps.includes(i) ? ' gap' : ''}`);

// ctx = { tables, lang, uopName(id) | null, opText(code) | null, opEffect(code) | null }
export function decodeLive(state, ctx) {
  const w = state.M >>> 0;
  const c2 = (w >>> 25) & 31, c1 = (w >>> 20) & 31, a2 = (w >>> 10) & 1023, a1 = w & 1023;
  const riCode = (state.RI >>> 10) & 31, riAddr = state.RI & 1023;
  const packed1 = (c1 << 10) | a1, packed2 = (c2 << 10) | a2;
  // Jumătatea în execuție: cea care se potrivește cu RI; dacă sunt la fel, faza spune care urmează.
  const ri = (riCode << 10) | riAddr;
  let now = state.phase === 2 ? 2 : 1;
  if (ri === packed1 && ri !== packed2) now = 1;
  else if (ri === packed2 && ri !== packed1) now = 2;

  const op = ctx.tables.ops[riCode];
  const mnemonic = op ? op.mnemonic : null;
  const effect = !op ? null
    : ctx.lang === 'en' ? ((ctx.opText && ctx.opText(riCode)) || op.effect_ro)
      : ((ctx.opEffect && ctx.opEffect(riCode)) || op.effect_ro);

  const uopId = state.R1 & 127;
  const known = uopId >= 0 && uopId < ctx.tables.uops.length;
  return {
    rai: { oct: oct(state.RAI & 1023, 4), dec: state.RAI & 1023, dots: dotClasses(bitsMsbFirst(state.RAI & 1023, 10), 'r') },
    ri: {
      code: oct(riCode, 2), addr: oct(riAddr, 4), mnemonic, effect,
      dots: dotClasses([...bitsMsbFirst(riCode, 5), ...bitsMsbFirst(riAddr, 10)], 'g', RI_GAPS),
    },
    halves: [
      { n: 1, text: `${oct(c1, 2)} ${oct(a1, 4)}` },
      { n: 2, text: `${oct(c2, 2)} ${oct(a2, 4)}` },
    ],
    now,
    m: {
      text: `${oct(c1, 2)} ${oct(a1, 4)}  ${oct(c2, 2)} ${oct(a2, 4)}`,
      dots: dotClasses(bitsMsbFirst(w, 31), 'g', M_GAPS),
    },
    uop: {
      id: uopId,
      label: known ? ctx.tables.uops[uopId].label_ro : null,
      // în engleză, sub inscripția românească de pe panou stă traducerea
      gloss: known && ctx.lang === 'en' && ctx.uopName ? ctx.uopName(uopId) : null,
    },
  };
}
