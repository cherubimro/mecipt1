// SPDX-License-Identifier: AGPL-3.0-or-later
// Inerția filamentului: becul se aprinde și se stinge exponențial (GHICIT: un bec mic de pupitru).
export const TAU_ON_MS = 25;
export const TAU_OFF_MS = 70;

export function glowStep(b, target, dtMs) {
  if (b === target) return b;
  const tau = target > b ? TAU_ON_MS : TAU_OFF_MS;
  return b + (target - b) * (1 - Math.exp(-dtMs / tau));
}
