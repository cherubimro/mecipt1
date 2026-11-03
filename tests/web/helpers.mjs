// SPDX-License-Identifier: AGPL-3.0-or-later
// Ajutoare pentru testele Node: încarcă WASM-ul real și programele.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadMecipt } from '../../web/js/mecipt.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const read = (p) => readFileSync(ROOT + p, 'utf8');
export const readJson = (p) => JSON.parse(read(p));
export const wasmBytes = () => readFileSync(ROOT + 'build/mecipt.wasm');
export const newMachine = () => loadMecipt(wasmBytes());
export const RETIPARIRE = () => read('programs/retiparire-1962.mec');
export const INEX = () => read('programs/inex1-preincarcator.mec');
export const INEX_TAPE = () => read('tests/data/inex-banda-3-cuvinte.mec');
export const prog = (body) => '@prov GHICIT test\n' + body;
