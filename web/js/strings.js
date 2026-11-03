// SPDX-License-Identifier: AGPL-3.0-or-later
// Textele afișate (română). Engleza vine în Planul 4.
export const S = {
  title: 'MECIPT-1 — pupitrul de comandă',
  subtitle: 'Institutul Politehnic din Timișoara, 1961',
  program: 'Programul',
  speed: 'Viteza',
  speedEpoca: 'ca în 1962',
  speedRapid: 'rapid (×100)',
  reload: 'Reîncarcă',
  hint: 'Apăsați CALCULEAZA — AUTOMAT pe panoul din dreapta (marcat cu galben). Ca să citiți inscripțiile, alegeți un singur panou la „Vedere”.',
  view: 'Vedere',
  views: { all: 'tot pupitrul', left: 'panoul stâng', middle: 'panoul din mijloc', right: 'panoul drept' },
  pulsesOff: 'Impulsurile sunt întrerupte: comutați IMPULSURI pe RESTABILESTE ca mașina să poată calcula.',
  tapeRows: (n) => (n === 1 ? '1 rând' : n % 100 >= 1 && n % 100 <= 19 ? `${n} rânduri` : `${n} de rânduri`),
  loading: 'Se încarcă mașina…',
  loadError: 'Nu s-a putut încărca pupitrul: ',
  tapeReader: 'Cititorul de bandă perforată',
  typewriter: 'Mașina de scris',
  tapeEmpty: 'fără bandă',
  tapeTest: 'bandă de test (GHICIT)',
  machineTime: 'timp de mașină',
  prov: { ORIGINAL: 'ORIGINAL', DEDUS: 'DEDUS', RECONSTRUCTIE: 'RECONSTRUCȚIE', GHICIT: 'GHICIT' },
  words: (n) => (n === 1 ? '1 cuvânt' : n % 100 >= 1 && n % 100 <= 19 ? `${n} cuvinte` : `${n} de cuvinte`),
  halt: {
    1: 'Oprit: instrucțiunea O (oprire).',
    2: 'Oprit: DEPĂȘIT CAPACITATEA REGISTRULUI.',
    3: 'Oprit: HÂRTIA AGĂȚATĂ (s-a terminat banda).',
    4: 'Oprit: cod de instrucțiune necunoscut.',
    5: 'Oprit de la pupitru.',
  },
  running: 'Mașina calculează.',
  idle: 'Mașina așteaptă.',
  switchLabel(id) {
    const m = /^switch-([A-Za-z0-9]+)-(\d+)$/.exec(id);
    if (!m) return id;
    const i = Number(m[2]);
    const named = {
      commands: ['ANULEAZA RAI', 'ANULEAZA M', 'ANULEAZA S', 'INTRODUCE 7 CATEG. DIN RA în RI', 'INTRODUCE M în I',
        'INTRODUCE M în RI', 'ADUNARE 1 (funcție necunoscută)', 'M+S 2 (funcție necunoscută)'],
      instr: ['INSTRUCTIA 1', 'INSTRUCTIA 2', 'MEMORIE TAMBUR (funcție necunoscută)', 'MEMORIE FERITE (funcție necunoscută)'],
      memory: ['MEMORIE SCRIERE', 'MEMORIE CITIRE'],
      pulses: ['IMPULSURI: INTRERUPE / RESTABILESTE'],
      overflow: ['La depășirea capacității registrului: SE OPRESTE', 'La depășirea capacității registrului: NU SE OPRESTE'],
      compute: ['CALCULEAZA AUTOMAT', 'CALCULEAZA INSTRUCTIE UNICA'],
      generator: ['Generatorul principal: comutatorul IMPULSURI', 'Generatorul principal: comutatorul 2',
        'Generatorul principal: comutatorul de jos'],
    };
    if (m[1] === 'M') return `Comutatorul ${i} al registrului M`;
    if (m[1] === 'RAI') return `Comutatorul RAI ${512 >> i}`;
    return (named[m[1]] && named[m[1]][i]) || id;
  },
  attribution: 'Pupitrul e redesenat după modelul 3D „MECIPT-1” (marius0198, CC BY 4.0) și fotografia din 2011 (Turbojet, CC BY-SA 4.0). Conținut CC BY-SA 4.0, cod AGPL-3.0.',
};
