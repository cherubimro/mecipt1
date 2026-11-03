// SPDX-License-Identifier: AGPL-3.0-or-later
// Valoarea unui element al pupitrului, spusă pe înțelesul vizitatorului: zecimal și octal, fracția
// unui cuvânt, instrucțiunile din el, numele microoperației. Fracția vine din nucleu (wordValue).
// ctx = { tables, wordValue, uopIndex, uops, lang, mode, pulsesOff, uopName(id)|null, opEffect(code)|null, opText(code)|null }

const oct = (v, n) => (v >>> 0).toString(8).padStart(n, '0');

const T = {
  ro: {
    word: (o, f, ins) => `Cuvântul din M: ${o} = ${f} sau, ca instrucțiuni: ${ins}`,
    bit: (i, b) => `Becul ${i}: ${b}.`,
    unknown: 'necunoscut',
    ri: (c, name, eff, a) => `Instrucțiunea în execuție: codul ${c} = ${name} — ${eff}; adresa ${oct(a, 4)} (${a}).`,
    rai: (a) => `Adresa instrucțiunii următoare: ${a}, în octal ${oct(a, 4)}.`,
    ra: (a) => `Registrul de adresă: ${a}, în octal ${oct(a, 4)}.`,
    r1: (n, name) => `Ultima microoperație: nr. ${n}${name ? ` — ${name}` : ''}.`,
    r2: (n, name) => `Microoperația dinaintea ei: nr. ${n}${name ? ` — ${name}` : ''}.`,
    uop: (name, on) => `${name} — ${on ? 'executată chiar acum' : 'nu se execută acum'}.`,
    litFor: 'Aprins', offFor: 'Stins (s-ar aprinde la',
    indicators: ['depășire de capacitate (DCR)', 'hârtia agățată: banda s-a terminat', 'mașina e oprită'],
    instr: (phase, i) => (i < 2 ? `Urmează instrucțiunea ${phase} din cuvânt.` : i === 2 ? 'Memoria de lucru e tamburul.' : 'Memoria cu ferite nu era încă legată.'),
    overflow: (stop) => (stop ? 'La depășire, mașina se oprește.' : 'La depășire, mașina nu se oprește.'),
    compute: (mode) => (mode === 'automat' ? 'Mașina calculează automat.' : mode === 'unic' ? 'Mașina merge câte o instrucțiune.' : 'Mașina nu calculează.'),
    pulses: (off) => (off ? 'Impulsurile sunt întrerupte.' : 'Impulsurile merg.'),
    decimal: ',',
  },
  en: {
    word: (o, f, ins) => `The word in M: ${o} = ${f}, or as instructions: ${ins}`,
    bit: (i, b) => `Lamp ${i}: ${b}.`,
    unknown: 'unknown',
    ri: (c, name, eff, a) => `Instruction being executed: code ${c} = ${name} — ${eff}; address ${oct(a, 4)} (${a}).`,
    rai: (a) => `Address of the next instruction: ${a}, in octal ${oct(a, 4)}.`,
    ra: (a) => `Address register: ${a}, in octal ${oct(a, 4)}.`,
    r1: (n, name) => `Last micro-operation: no. ${n}${name ? ` — ${name}` : ''}.`,
    r2: (n, name) => `The micro-operation before it: no. ${n}${name ? ` — ${name}` : ''}.`,
    uop: (name, on) => `${name} — ${on ? 'executing right now' : 'not executing now'}.`,
    litFor: 'Lit', offFor: 'Off (it would light for',
    indicators: ['capacity overflow (DCR)', 'paper jammed: the tape has run out', 'the machine is stopped'],
    instr: (phase, i) => (i < 2 ? `Instruction ${phase} of the word comes next.` : i === 2 ? 'The working memory is the drum.' : 'The ferrite memory was not yet connected.'),
    overflow: (stop) => (stop ? 'On overflow, the machine stops.' : 'On overflow, the machine does not stop.'),
    compute: (mode) => (mode === 'automat' ? 'The machine computes automatically.' : mode === 'unic' ? 'The machine runs one instruction at a time.' : 'The machine is not computing.'),
    pulses: (off) => (off ? 'The pulses are interrupted.' : 'The pulses are running.'),
    decimal: '.',
  },
};

function uopName(id, ctx) {
  if (id < 0 || id >= ctx.tables.uops.length) return null;
  if (ctx.lang === 'en' && ctx.uopName) return ctx.uopName(id);
  return ctx.tables.uops[id].label_ro;
}

function opName(code, ctx, t) {
  const op = ctx.tables.ops[code];
  return op ? op.mnemonic : `${oct(code, 2)} → ${t.unknown}`;
}

// Efectul REAL al codului (14/15 sunt inversate față de tabel — vezi semantica): în română din nucleu
// (ctx.opEffect = Machine.opEffect), în engleză din traducere (ctx.opText).
function opEffect(code, ctx, t) {
  const op = ctx.tables.ops[code];
  if (!op) return t.unknown;
  if (ctx.lang === 'en') return (ctx.opText && ctx.opText(code)) || op.effect_ro;
  return (ctx.opEffect && ctx.opEffect(code)) || op.effect_ro;
}

export function describeValue(targetId, state, ctx) {
  const t = T[ctx.lang] || T.ro;
  const m = /^(lamp|switch)-([A-Za-z0-9]+)-(\d+)$/.exec(targetId);
  if (!m) return null;
  const [, kind, group, k] = m;
  const i = Number(k);
  switch (group) {
    case 'M': {
      const w = state.M >>> 0;
      const c2 = (w >>> 25) & 31, c1 = (w >>> 20) & 31, a2 = (w >>> 10) & 1023, a1 = w & 1023;
      const frac = ctx.wordValue(w).toFixed(6).replace('.', t.decimal);
      const ins = `${oct(c1, 2)} ${oct(a1, 4)}  ${oct(c2, 2)} ${oct(a2, 4)} `
        + `(${opName(c1, ctx, t)} ${oct(a1, 4)}, ${opName(c2, ctx, t)} ${oct(a2, 4)})`;
      return `${t.word(oct(w, 11), frac, ins)}. ${t.bit(i, (w >>> (30 - i)) & 1)}`;
    }
    case 'RI': {
      const code = (state.RI >>> 10) & 31, a = state.RI & 1023;
      return t.ri(oct(code, 2), opName(code, ctx, t), opEffect(code, ctx, t), a);
    }
    case 'RAI': return t.rai(state.RAI & 1023);
    case 'RA': return t.ra(state.RA & 1023);
    case 'R1': return t.r1(state.R1 & 127, uopName(state.R1 & 127, ctx));
    case 'R2': return t.r2(state.R2 & 127, uopName(state.R2 & 127, ctx));
    case 'uop': {
      const id = ctx.uopIndex[i];
      if (kind !== 'lamp' || id < 0) return null;
      return t.uop(uopName(id, ctx), ctx.uops[id] > 0);
    }
    case 'indicators': {
      const v = [state.dcr, state.hirtie, state.oprit][i];
      return v ? `${t.litFor}: ${t.indicators[i]}.` : `${t.offFor}: ${t.indicators[i]}).`;
    }
    case 'instr': return kind === 'lamp' ? t.instr(state.phase, i) : null;
    case 'overflow': return kind === 'lamp' ? t.overflow(!!state.stopOnDcr) : null;
    case 'compute': return kind === 'lamp' ? t.compute(ctx.mode) : null;
    case 'pulses': return t.pulses(!!ctx.pulsesOff);
    default: return null;
  }
}
