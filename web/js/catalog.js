// SPDX-License-Identifier: AGPL-3.0-or-later
// Câmpurile de text din catalogul programelor (web/programs/catalog.json), în limba paginii.
// note / note_en: spus după proveniență (de exemplu „calcul ilustrativ…”); tape_note / tape_note_en: ce bandă e în cititor.
export function catalogNote(entry, key, lang) {
  if (!entry) return null;
  return (lang === 'en' ? entry[`${key}_en`] : entry[key]) || null;
}
