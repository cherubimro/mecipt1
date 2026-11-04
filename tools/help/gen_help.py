# SPDX-License-Identifier: AGPL-3.0-or-later
# Generează web/data/help/{ro,en}.json: python3 tools/help/gen_help.py web/data/help
import json

SOURCES = {
 'baltac2011': ({'cite': 'Vasile Baltac, „MECIPT – Mașina Electronică de Calcul a Institutului Politehnic din Timișoara – Evocări și Documente”, 2011', 'where': 'facsimilele 3 (tabelul de sinus, 21.02.1962), 4 (retipărirea, 6.09.1962), 5 (INEX-1), 8 (tamburul), 11 (ferite)'},
                {'cite': 'Vasile Baltac, “MECIPT – Mașina Electronică de Calcul a Institutului Politehnic din Timișoara – Evocări și Documente” (Recollections and Documents), 2011', 'where': 'facsimiles 3 (the sine table, 21 Feb 1962), 4 (program reprinting, 6 Sept 1962), 5 (INEX-1), 8 (the drum), 11 (ferrites)'}),
 'baltacLab': ({'cite': 'Vasile Baltac, lucrările de laborator la MECIPT-1, 1965–1966', 'where': 'Lucrarea 7 (p. 1, 3, 6) și Lucrarea 8, paginile păstrate'},
               {'cite': 'Vasile Baltac, MECIPT-1 laboratory work sheets, 1965–1966', 'where': 'sheet 7 (pp. 1, 3, 6) and sheet 8, surviving pages'}),
 'geier1961': ({'cite': 'A. Geier, „Programarea calculatorului electronic cifric MECIPT I în regimul virgulă mobilă”, Buletinul Științific și Tehnic al IPT, 1961', 'where': 'tabelul instrucțiunilor, reprodus în Wikipedia RO'},
               {'cite': 'A. Geier, “Programarea calculatorului electronic cifric MECIPT I în regimul virgulă mobilă” (Programming the MECIPT I in floating point), Scientific and Technical Bulletin of the Polytechnic Institute of Timișoara, 1961', 'where': 'the instruction table, reproduced in the Romanian Wikipedia'}),
 'wikiRO': ({'cite': 'Wikipedia în limba română, articolul „MECIPT”', 'where': 'secțiunile despre MECIPT-1 și setul de instrucțiuni', 'url': 'https://ro.wikipedia.org/wiki/MECIPT'},
            {'cite': 'Romanian Wikipedia, article “MECIPT”', 'where': 'the sections on MECIPT-1 and its instruction set', 'url': 'https://ro.wikipedia.org/wiki/MECIPT'}),
 'farcas2005': ({'cite': 'Dan D. Farcaș, „MECIPT, o istorie subiectivă”, 2005', 'where': 'descrierea mașinii, a benzii și a mașinii de scris'},
                {'cite': 'Dan D. Farcaș, “MECIPT, o istorie subiectivă” (MECIPT, a subjective history), 2005', 'where': 'description of the machine, the tape and the typewriter'}),
 'maruster': ({'cite': 'Ștefan Mărușter, „Povestea unei lucrări”', 'where': 'amintiri despre programarea MECIPT-1'},
              {'cite': 'Ștefan Mărușter, “Povestea unei lucrări” (The story of a piece of work)', 'where': 'recollections of programming MECIPT-1'}),
 'baltacKey': ({'cite': 'Vasile Baltac, „Key Aspects of the History of Computing in Romania”', 'where': 'contextul istoric'},
               {'cite': 'Vasile Baltac, “Key Aspects of the History of Computing in Romania”', 'where': 'historical context'}),
 'model3d': ({'cite': 'marius0198, modelul 3D „MECIPT-1”, Sketchfab, 2020, CC BY 4.0', 'where': 'texturile panourilor (inscripțiile) și pozițiile becurilor', 'url': 'https://sketchfab.com/3d-models/mecipt-1-62ddfc49f1c54967967d76abab5f3d2d'},
             {'cite': 'marius0198, 3D model “MECIPT-1”, Sketchfab, 2020, CC BY 4.0', 'where': 'panel textures (inscriptions) and lamp positions', 'url': 'https://sketchfab.com/3d-models/mecipt-1-62ddfc49f1c54967967d76abab5f3d2d'}),
 'photo2011': ({'cite': 'Turbojet, „MECIPT-1 Control desk”, Wikimedia Commons, 2011, CC BY-SA 4.0', 'where': 'aspectul pupitrului restaurat, culorile becurilor', 'url': 'https://commons.wikimedia.org/wiki/File:MECIPT-1_Control_desk.jpg'},
               {'cite': 'Turbojet, “MECIPT-1 Control desk”, Wikimedia Commons, 2011, CC BY-SA 4.0', 'where': 'the restored console, lamp colours', 'url': 'https://commons.wikimedia.org/wiki/File:MECIPT-1_Control_desk.jpg'}),
 'farcas1964': ({'cite': 'D. Farcaș, despre dimensionarea arcelor încastrate cu MECIPT-1, Buletinul Științific și Tehnic al IPT, 1964', 'where': 'doar ideea metodei; articolul n-a putut fi consultat'},
                {'cite': 'D. Farcaș, on sizing fixed arches with MECIPT-1, Scientific and Technical Bulletin of the Polytechnic Institute of Timișoara, 1964', 'where': 'only the idea of the method; the article could not be consulted'}),
 'photoDrum2015': ({'cite': 'Turbojet, „MECIPT-1 Drum memory” și „MECIPT-1 Drum memory 2”, Wikimedia Commons, 2015, CC BY-SA 4.0', 'where': 'tamburul la Muzeul Banatului, Timișoara', 'url': 'https://commons.wikimedia.org/wiki/File:MECIPT-1_Drum_memory.jpg'},
                   {'cite': 'Turbojet, “MECIPT-1 Drum memory” and “MECIPT-1 Drum memory 2”, Wikimedia Commons, 2015, CC BY-SA 4.0', 'where': 'the drum at the Museum of Banat, Timișoara', 'url': 'https://commons.wikimedia.org/wiki/File:MECIPT-1_Drum_memory.jpg'}),
 'semantica': ({'cite': 'Proiectul emulatorului: „Semantica emulatorului — ce e sigur, dedus sau ghicit”', 'where': 'documentația, capitolul 7', 'url': 'doc.html#07-ce-e-sigur'},
               {'cite': 'The emulator project: “Emulator semantics — what is certain, deduced or guessed”', 'where': 'documentation, chapter 7', 'url': 'doc.html?lang=en#07-ce-e-sigur'}),
}

E = []
def e(key, status, sources, ro, en):
    E.append((key, status, sources, ro, en))

# ---------------- panourile ----------------
e('panel-right', 'SIGUR', ['model3d', 'photo2011'],
  ('Panoul drept — registrele și comenzile',
   'Aici lucra operatorul: becurile arată registrele mașinii, iar comutatoarele și butoanele introduc cuvinte și adrese și pornesc calculul.',
   'De sus în jos:\n\n- **M** — registrul de memorie, 31 de becuri verzi numerotate 0–30, cu câte un comutator dedesubt;\n- **RI** — registrul de instrucțiuni (codul și adresa instrucțiunii în execuție), sub inscripțiile CODUL 2, CODUL 1, ADRESA 2, ADRESA 1;\n- **R I** — registrul de microinstrucțiuni (7 becuri) și **RA** — registrul de adresă;\n- **RAI** — registrul de adresă al instrucțiunii, cu comutatoare, apoi INSTRUCTIA 1/2 și MEMORIE TAMBUR/FERITE;\n- comenzile ANULEAZA și INTRODUCE;\n- jos: MEMORIE, IMPULSURI, ce face mașina la depășire, becurile de stare și CALCULEAZA.\n\nInscripțiile sunt redesenate literă cu literă după texturile modelului 3D; culorile becurilor după fotografia din 2011.'),
  ('Right panel — registers and controls',
   'This is where the operator worked: the lamps show the machine registers, and the switches and buttons enter words and addresses and start the computation.',
   'From top to bottom:\n\n- **M** — the memory register, 31 green lamps numbered 0–30, each with a switch below;\n- **RI** — the instruction register (code and address of the instruction being executed), under the inscriptions CODUL 2, CODUL 1, ADRESA 2, ADRESA 1 (code 2, code 1, address 2, address 1);\n- **R I** — the micro-instruction register (7 lamps) and **RA** — the address register;\n- **RAI** — the instruction address register, with switches, then INSTRUCTIA 1/2 (instruction 1/2) and MEMORIE TAMBUR/FERITE (drum/ferrite memory);\n- the ANULEAZA (clear) and INTRODUCE (enter) commands;\n- bottom: MEMORIE (memory), IMPULSURI (pulses), what the machine does on overflow, the status lamps and CALCULEAZA (compute).\n\nThe inscriptions are redrawn letter by letter from the textures of the 3D model; the lamp colours follow the 2011 photograph. The inscriptions stay in Romanian, as on the real console.'))
e('panel-left', 'MIXT', ['model3d', 'baltacLab', 'semantica'],
  ('Panoul stâng — microoperațiile și generatorul',
   'Fiecare bec din grilă poartă numele unei microoperații, pașii mărunți din care e făcută o instrucțiune. Dedesubt: generatorul principal și registrul R II.',
   'MECIPT-1 era **microprogramat**: doar adunarea era cablată, restul instrucțiunilor se făceau din pași elementari (schema Wilkes), SIGUR după Wikipedia RO și Lucrarea 7.\n\n- Grila mare are antetul ⎍ (impuls pozitiv), 16 × 3 celule, din care 35 au inscripție; grila mică ⊔ (impuls negativ), 3 × 3, are 4.\n- Numele de pe celule sunt SIGURE acolo unde se citesc; câteva sunt nesigure (marcate în transcriere).\n- Ordinea microoperațiilor din fiecare instrucțiune nu s-a păstrat; emulatorul o compune din aceste nume — DEDUS.\n- **R II** (7 becuri, 64 … 1) primește la fiecare pas conținutul lui R I de pe panoul drept (Lucrarea 7, p. 3).'),
  ('Left panel — micro-operations and the generator',
   'Each lamp in the grid carries the name of a micro-operation, one of the small steps an instruction is made of. Below: the main generator and register R II.',
   'MECIPT-1 was **microprogrammed**: only addition was hard-wired; the other instructions were built from elementary steps (the Wilkes scheme) — CERTAIN, after the Romanian Wikipedia and lab sheet 7.\n\n- The large grid has the heading ⎍ (positive pulse), 16 × 3 cells, 35 of them inscribed; the small grid ⊔ (negative pulse), 3 × 3, has 4.\n- The cell names are CERTAIN where legible; a few are uncertain (marked in the transcription).\n- The order of micro-operations inside each instruction has not survived; the emulator composes it from these names — DEDUCED.\n- **R II** (7 lamps, 64 … 1) receives at every step the content of R I on the right panel (lab sheet 7, p. 3).'))
e('panel-middle', 'MIXT', ['photo2011', 'wikiRO', 'semantica'],
  ('Panoul din mijloc — aparatele de măsură',
   'Voltmetre pentru tensiunile de alimentare ale celor aproximativ 2000 de tuburi electronice. Ce măsura fiecare nu se știe.',
   'Aparatele, selectorul și comutatoarele se văd în fotografia din 2011 (SIGUR); pe ea nu se citesc inscripții. Mașina avea circa 2000 de triode și consuma cam 10 kW (Wikipedia RO, după Farcaș). Ce tensiune arăta fiecare aparat, scalele și rostul comenzilor sunt GHICITE. În emulator, comenzile acestui panou nu fac nimic.'),
  ('Middle panel — measuring instruments',
   'Voltmeters for the supply voltages of the roughly 2000 electron tubes. What each one measured is not known.',
   'The instruments, the selector and the switches are visible in the 2011 photograph (CERTAIN); no inscriptions can be read on it. The machine had about 2000 triodes and used about 10 kW (Romanian Wikipedia, after Farcaș). Which voltage each meter showed, the scales and the purpose of the controls are GUESSED. In the emulator the controls of this panel do nothing.'))

# ---------------- panoul drept ----------------
e('lamp-M', 'SIGUR', ['baltacLab', 'wikiRO', 'photo2011'],
  ('Registrul M (memorie)',
   'Cele 31 de becuri arată cuvântul din registrul M, bit cu bit: aprins = 1. Becul 0 e semnul. Prin M trec cuvintele spre și dinspre tambur.',
   'Un cuvânt are 31 de biți, m0 … m30 (Lucrarea 7, p. 1):\n\n- ca **număr**: m0 e semnul, ceilalți dau o fracție între −1 și 1, în complement față de unu (deci există și „−0”);\n- ca **instrucțiuni**: m1–m5 codul 2, m6–m10 codul 1, m11–m20 adresa 2, m21–m30 adresa 1 — două instrucțiuni într-un cuvânt.\n\nProgramatorii citeau becurile în grupe de câte trei, în octal. Panoul e numerotat 0–30 (SIGUR, texturile modelului 3D); becurile sunt verzi în fotografia din 2011.'),
  ('Register M (memory)',
   'The 31 lamps show the word in register M, bit by bit: lit = 1. Lamp 0 is the sign. Words travel to and from the drum through M.',
   'A word has 31 bits, m0 … m30 (lab sheet 7, p. 1):\n\n- as a **number**: m0 is the sign, the others give a fraction between −1 and 1 in ones’ complement (so there is also a “−0”);\n- as **instructions**: m1–m5 code 2, m6–m10 code 1, m11–m20 address 2, m21–m30 address 1 — two instructions in one word.\n\nProgrammers read the lamps in groups of three, in octal. The panel is numbered 0–30 (CERTAIN, 3D model textures); the lamps are green in the 2011 photograph.'))
e('switch-M', 'MIXT', ['farcas2005', 'wikiRO', 'semantica'],
  ('Comutatoarele registrului M',
   'Cu ele operatorul punea un cuvânt în M, bit cu bit, de obicei în grupe de câte trei (octal). În emulator, pârghia sus = 1.',
   'Că becurile M sunt dublate de comutatoare e SIGUR (Farcaș, Wikipedia RO). Că un comutator încarcă direct bitul lui în M e DEDUS.\n\n**GHICIT:** sensul pârghiei (sus = 1) și faptul că pârghia ține poziția și pune tot cuvântul în M la fiecare mutare. Butoanele ANULEAZA M și ANULEAZA RAI sugerează o altă procedură posibilă: registrul se golea, apoi comutatoarele adăugau biții. Până la o sursă, emulatorul păstrează varianta simplă.\n\nProcedura de introducere a unui program de mână: cuvântul pe comutatoarele M, adresa pe comutatoarele RAI, apoi MEMORIE SCRIERE.'),
  ('Register M switches',
   'With them the operator put a word into M, bit by bit, usually in groups of three (octal). In the emulator, lever up = 1.',
   'That the M lamps are paired with switches is CERTAIN (Farcaș, Romanian Wikipedia). That a switch loads its bit directly into M is DEDUCED.\n\n**GUESSED:** the lever direction (up = 1), and that the lever latches and puts the whole word into M at every move. The ANULEAZA M and ANULEAZA RAI (clear) buttons suggest another possible procedure: the register was cleared, then the switches added bits. Until a source turns up, the emulator keeps the simple version.\n\nEntering a program by hand: the word on the M switches, the address on the RAI switches, then MEMORIE SCRIERE (memory: write).'))
e('lamp-RI', 'SIGUR', ['baltacLab', 'model3d', 'photo2011'],
  ('Registrul de instrucțiuni RI',
   'Arată instrucțiunea care se execută: primele 5 becuri sunt codul operației, următoarele 10 adresa din memorie cu care lucrează.',
   'RI are 15 biți = o instrucțiune: cod de 5 biți (ponderile 16 8 4 2 1, sub CODUL 2) și adresă de 10 biți (512 … 1, sub ADRESA 2). Codurile se scriau în octal: de exemplu 33 = CIT (citește un caracter de pe bandă), 05 = A (adunare), 25 = ME (memorare). Tabelul complet e în documentație.\n\nCulorile (verde, verde, chihlimbar, roșu, roșu, apoi verde) sunt cele din fotografia din 2011.'),
  ('Instruction register RI',
   'Shows the instruction being executed: the first 5 lamps are the operation code, the next 10 the memory address it works with.',
   'RI has 15 bits = one instruction: a 5-bit code (weights 16 8 4 2 1, under CODUL 2) and a 10-bit address (512 … 1, under ADRESA 2). Codes were written in octal, e.g. 33 = CIT (read tape), 05 = A (add), 25 = ME (store). The full table is in the documentation.\n\nThe colours (green, green, amber, red, red, then green) are those of the 2011 photograph.'))
e('lamp-R1', 'MIXT', ['baltacLab', 'semantica'],
  ('Registrul de microinstrucțiuni R I',
   'Șapte becuri cu numărul microoperației curente. La fiecare pas, numărul trece în R II, pe panoul stâng, iar noua microoperație intră în R I.',
   'Lucrarea 7 (p. 3) spune că există două registre de microinstrucțiuni, R1 și R2, de câte 7 biți, și că „impulsurile de ritm impar produc trecerea conținutului registrului R1 în R2” — SIGUR. Numărul afișat de emulator în R I (numărul celulei din grila panoului stâng) e GHICIT: adresele reale ale microprogramelor (de exemplu 94 → 90 → 24 la tipărirea unei cifre, Lucrarea 7 p. 6) nu se potrivesc cu grila, iar tabelul lor complet s-a pierdut.'),
  ('Micro-instruction register R I',
   'Seven lamps with the number of the current micro-operation. At each step the number moves to R II on the left panel and the new micro-operation enters R I.',
   'Lab sheet 7 (p. 3) says there are two micro-instruction registers, R1 and R2, of 7 bits each, and that “the odd-rhythm pulses move the content of R1 into R2” — CERTAIN. The number the emulator shows in R I (the number of the grid cell on the left panel) is GUESSED: the real microprogram addresses (e.g. 94 → 90 → 24 when printing a digit, lab sheet 7 p. 6) do not match the grid, and their full table is lost.'))
e('lamp-R2', 'MIXT', ['baltacLab', 'model3d', 'semantica'],
  ('Registrul de microinstrucțiuni R II',
   'Șapte becuri: microoperația de dinaintea celei din R I. Împreună, R I și R II lasă operatorul să urmărească microprogramul pas cu pas.',
   'Inscripția R II și ponderile 64 … 1 sunt pe textura panoului stâng (SIGUR). Trecerea R I → R II la fiecare pas e scrisă în Lucrarea 7, p. 3 (SIGUR); numerotarea microoperațiilor din emulator e GHICITĂ (vezi R I).'),
  ('Micro-instruction register R II',
   'Seven lamps: the micro-operation before the one in R I. Together, R I and R II let the operator follow the microprogram step by step.',
   'The inscription R II and the weights 64 … 1 are on the left panel texture (CERTAIN). The R I → R II transfer at every step is written in lab sheet 7, p. 3 (CERTAIN); the numbering of micro-operations in the emulator is GUESSED (see R I).'))
e('lamp-RA', 'MIXT', ['model3d', 'baltacLab', 'semantica'],
  ('Registrul de adresă RA',
   'Zece becuri cu adresa de pe tambur la care lucrează instrucțiunea curentă (ponderi 512 … 1).',
   'Inscripția RA și cele 10 ponderi sunt pe panou (SIGUR). Microoperațiile „(ra)/2 trece în RA” și „2(ra) trece în RAI” arată că RA ținea adrese și se folosea la saltul în program; restul rolului lui e DEDUS.'),
  ('Address register RA',
   'Ten lamps with the drum address the current instruction is working with (weights 512 … 1).',
   'The inscription RA and its 10 weights are on the panel (CERTAIN). The micro-operations “(ra)/2 goes into RA” and “2(ra) goes into RAI” show that RA held addresses and was used for jumps; the rest of its role is DEDUCED.'))
e('lamp-RAI', 'MIXT', ['baltacLab', 'model3d', 'semantica'],
  ('Registrul de adresă al instrucțiunii (RAI)',
   'Adresa de pe tambur a cuvântului cu instrucțiunea următoare. După ce se execută ambele instrucțiuni ale unui cuvânt, RAI crește cu 1.',
   'Inscripția de pe panou: „REG DE ADRESA A INSTRUCTIEI — RAI”, cu ponderile 512 … 1 — SIGUR. Lucrarea 7, p. 6, scrie „trece instrucția 2 în locul instrucției 1” și „RAI+1→RAI” — SIGUR; că RAI crește abia după ce s-au executat ambele instrucțiuni ale cuvântului e DEDUS din aceste rânduri și din programele originale. Tamburul avea 1024 de adrese, 0000–1777 în octal.'),
  ('Instruction address register (RAI)',
   'The drum address of the word holding the next instruction. After both instructions of a word have run, RAI goes up by 1.',
   'The panel inscription reads “REG DE ADRESA A INSTRUCTIEI — RAI” (instruction address register), with weights 512 … 1 — CERTAIN. Lab sheet 7, p. 6, writes “instruction 2 moves into the place of instruction 1” and “RAI+1→RAI” — CERTAIN; that RAI goes up only after both instructions of the word have run is DEDUCED from these lines and from the original programs. The drum had 1024 addresses, 0000–1777 in octal.'))
e('switch-RAI', 'MIXT', ['baltacLab', 'baltac2011', 'semantica'],
  ('Comutatoarele RAI',
   'Aici se punea adresa de la care pornește programul, sau adresa la care se scrie ori se citește un cuvânt cu MEMORIE. Pârghia sus = 1 (ghicit).',
   'Preîncărcătorul INEX-1 cerea „se pornește calculatorul de la 0010” (Facsimil 5) — deci adresa de pornire se dădea de la pupitru: SIGUR. Că se dădea chiar din aceste comutatoare e DEDUS. Sensul pârghiei și faptul că ține poziția sunt GHICITE.\n\nCând alegeți un program în pagină, comutatoarele sunt deja puse pe adresa lui de pornire (1477 pentru retipărire, 0010 pentru INEX-1).'),
  ('RAI switches',
   'Here the operator set the address where the program starts, or the address to write or read with MEMORIE. Lever up = 1 (guessed).',
   'The INEX-1 preloader says “start the computer from 0010” (facsimile 5), so the start address was given from the console: CERTAIN. That it was given with these switches is DEDUCED. The lever direction and its latching are GUESSED.\n\nWhen you choose a program on the page, the switches are already set to its start address (1477 for the reprinting program, 0010 for INEX-1).'))
e('lamp-instr', 'MIXT', ['baltacLab', 'baltac2011', 'semantica'],
  ('INSTRUCTIA 1 / 2, MEMORIE TAMBUR / FERITE',
   'Primele două becuri arată care din cele două instrucțiuni ale cuvântului urmează. TAMBUR: memoria folosită; FERITE: memoria cu ferite, pregătită, dar nelegată.',
   'Ordinea „întâi instrucțiunea 1, apoi 2, apoi RAI + 1” e DEDUSĂ din Lucrarea 7 (p. 6) și confirmată de programele originale INEX-1 și retipărirea, care rulează corect doar așa. Memoria cu ferite a fost cercetată în 1962–1963 (Facsimil 11, Baltac); în emulator becul FERITE stă stins — GHICIT.'),
  ('INSTRUCTIA 1 / 2, MEMORIE TAMBUR / FERITE',
   'The first two lamps show which of the word’s two instructions comes next. TAMBUR (drum): the memory in use; FERITE (ferrites): the ferrite memory, prepared but not connected.',
   'The order “instruction 1 first, then 2, then RAI + 1” is DEDUCED from lab sheet 7 (p. 6) and confirmed by the original INEX-1 and reprinting programs, which only run correctly this way. Ferrite memory was researched in 1962–1963 (facsimile 11, Baltac); in the emulator the FERITE lamp stays off — GUESSED.'))
for i, (ro_t, ro_s, en_t, en_s, st) in enumerate([
    ('INSTRUCTIA 1', 'Face din prima instrucțiune a cuvântului următoarea de executat.', 'INSTRUCTIA 1 (instruction 1)', 'Makes the first instruction of the word the next one to run.', 'DEDUS'),
    ('INSTRUCTIA 2', 'Face din a doua instrucțiune a cuvântului următoarea de executat.', 'INSTRUCTIA 2 (instruction 2)', 'Makes the second instruction of the word the next one to run.', 'DEDUS'),
    ('MEMORIE TAMBUR', 'Funcția exactă nu se cunoaște; probabil alegea tamburul ca memorie de lucru. În emulator nu face nimic.', 'MEMORIE TAMBUR (drum memory)', 'Its exact function is unknown; it probably selected the drum as working memory. In the emulator it does nothing.', 'GHICIT'),
    ('MEMORIE FERITE', 'Funcția exactă nu se cunoaște; legată de memoria cu ferite, cercetată în 1962–1963. În emulator nu face nimic.', 'MEMORIE FERITE (ferrite memory)', 'Its exact function is unknown; linked to the ferrite memory researched in 1962–1963. In the emulator it does nothing.', 'GHICIT')]):
    if i < 2:
        e(f'switch-instr-{i}', st, ['baltacLab', 'semantica'],
          (ro_t, ro_s, 'Lucrarea 7, p. 6: „trece instrucția 2 în locul instrucției 1”. Efectul butonului în emulator — pune faza pe instrucțiunea aleasă — e DEDUS.'),
          (en_t, en_s, 'Lab sheet 7, p. 6: “instruction 2 moves into the place of instruction 1”. The button’s effect in the emulator — it sets the phase to the chosen instruction — is DEDUCED.'))
    else:
        e(f'switch-instr-{i}', st, ['model3d', 'baltac2011', 'semantica'],
          (ro_t, ro_s, 'Inscripția ' + ro_t + ' e pe panou (SIGUR). Nicio sursă păstrată nu spune ce făcea butonul; în emulator nu face nimic — GHICIT.' + (' Memoria cu ferite a fost cercetată în 1962–1963 (Facsimil 11, Baltac).' if i == 3 else '')),
          (en_t, en_s, 'The inscription ' + ro_t + ' is on the panel (CERTAIN). No surviving source says what the button did; in the emulator it does nothing — GUESSED.' + (' Ferrite memory was researched in 1962–1963 (facsimile 11, Baltac).' if i == 3 else '')))
CMD = [
 ('ANULEAZA RAI', 'Pune RAI pe zero: programul va porni de la adresa 0000.', 'DEDUS', 'ANULEAZA RAI (clear RAI)', 'Sets RAI to zero: the program will start from address 0000.'),
 ('ANULEAZA M', 'Golește registrul M: toți biții devin 0.', 'DEDUS', 'ANULEAZA M (clear M)', 'Clears register M: all bits become 0.'),
 ('ANULEAZA S', 'Golește acumulatorul S, registrul în care se fac calculele. S nu are becuri pe pupitru.', 'DEDUS', 'ANULEAZA S (clear S)', 'Clears accumulator S, the register where calculations happen. S has no lamps on the console.'),
 ('INTRODUCE 7 CATEG. DIN RA în RI', 'Copiază 7 biți („7 categorii”) din RA în registrul de microinstrucțiuni R I.', 'DEDUS', 'INTRODUCE 7 CATEG. DIN RA în RI (enter 7 bits of RA into R I)', 'Copies 7 bits (“7 categories”) from RA into the micro-instruction register R I.'),
 ('INTRODUCE M în I', 'Copiază cuvântul din M în registrul I, al doilea registru de calcul.', 'DEDUS', 'INTRODUCE M în I (enter M into I)', 'Copies the word in M into register I, the second arithmetic register.'),
 ('INTRODUCE M în RI', 'Pune în RI instrucțiunea curentă din cuvântul aflat în M, ca s-o poată executa direct.', 'DEDUS', 'INTRODUCE M în RI (enter M into RI)', 'Puts the current instruction of the word in M into RI, so it can be executed directly.'),
 ('ADUNARE 1', 'Funcția acestui buton nu se cunoaște. În emulator nu face nimic.', 'GHICIT', 'ADUNARE 1 (addition 1)', 'The function of this button is unknown. In the emulator it does nothing.'),
 ('M+S 2', 'Funcția acestui buton nu se cunoaște. În emulator nu face nimic.', 'GHICIT', 'M+S 2', 'The function of this button is unknown. In the emulator it does nothing.')]
for i, (rt, rs, st, et, es) in enumerate(CMD):
    e(f'switch-commands-{i}', st, ['model3d', 'semantica'],
      (rt, rs, 'Inscripția e pe panou (SIGUR). ' + ('Efectul e DEDUS din inscripție.' if st == 'DEDUS' else 'Ce făcea nu reiese din inscripție și nicio sursă păstrată nu o spune — GHICIT.')),
      (et, es, 'The inscription is on the panel (CERTAIN). ' + ('The effect is DEDUCED from the inscription.' if st == 'DEDUS' else 'What it did does not follow from the inscription and no surviving source says — GUESSED.')))
e('lamp-memory', 'MIXT', ['photo2011', 'semantica'],
  ('Becurile MEMORIE',
   'Pătratul roșu clipește când se scrie un cuvânt pe tambur de la pupitru, cel albastru la citire. Rostul lor e ghicit.',
   'Culorile și forma pătrată se văd în fotografia din 2011 (SIGUR). Legătura cu SCRIERE și CITIRE e GHICITĂ, după așezarea lor deasupra butoanelor.'),
  ('MEMORIE lamps',
   'The red square flashes when a word is written to the drum from the console, the blue one when reading. Their purpose is guessed.',
   'The colours and the square shape are visible in the 2011 photograph (CERTAIN). The link with SCRIERE (write) and CITIRE (read) is GUESSED from their position above the buttons.'))
e('switch-memory-0', 'DEDUS', ['model3d', 'semantica'],
  ('MEMORIE SCRIERE',
   'Scrie cuvântul din M pe tambur, la adresa din RAI. Așa se introducea un program de mână, cuvânt cu cuvânt.',
   'Inscripția MEMORIE / SCRIERE e pe panou (SIGUR); efectul (tambur[RAI] ← M) e DEDUS din inscripții și din faptul că RAI are comutatoare.'),
  ('MEMORIE SCRIERE (memory: write)',
   'Writes the word in M to the drum, at the address in RAI. This is how a program was entered by hand, word by word.',
   'The inscription MEMORIE / SCRIERE is on the panel (CERTAIN); the effect (drum[RAI] ← M) is DEDUCED from the inscriptions and from RAI having switches.'))
e('switch-memory-1', 'DEDUS', ['model3d', 'semantica'],
  ('MEMORIE CITIRE',
   'Aduce în M cuvântul de pe tambur de la adresa din RAI, ca să poată fi citit pe becuri.',
   'Inscripția MEMORIE / CITIRE e pe panou (SIGUR); efectul (M ← tambur[RAI]) e DEDUS.'),
  ('MEMORIE CITIRE (memory: read)',
   'Brings the word at the RAI address from the drum into M, so it can be read on the lamps.',
   'The inscription MEMORIE / CITIRE is on the panel (CERTAIN); the effect (M ← drum[RAI]) is DEDUCED.'))
e('lamp-pulses', 'GHICIT', ['photo2011', 'semantica'],
  ('Becurile IMPULSURI',
   'Arată dacă impulsurile de ceas ale mașinii merg (verde) sau sunt întrerupte (roșu). Fără impulsuri, mașina stă.',
   'Becurile roșu și verde se văd în fotografia din 2011 (SIGUR); semnificația lor e GHICITĂ.'),
  ('IMPULSURI lamps (pulses)',
   'Show whether the machine’s clock pulses are running (green) or interrupted (red). Without pulses the machine stands still.',
   'The red and green lamps are visible in the 2011 photograph (CERTAIN); their meaning is GUESSED.'))
e('switch-pulses-0', 'GHICIT', ['model3d', 'semantica'],
  ('IMPULSURI: INTRERUPE / RESTABILESTE',
   'Întrerupe impulsurile mașinii, oprind-o pe loc, apoi le restabilește. După restabilire, programul se reia cu CALCULEAZA.',
   'Inscripțiile IMPULSURI, INTRERUPE (parțial ștearsă) și RESTABILESTE sunt pe panou. Efectul din emulator (oprire, becul OPRIT aprins) e GHICIT. Alegerea unui program readuce impulsurile.'),
  ('IMPULSURI: INTRERUPE / RESTABILESTE (pulses: interrupt / restore)',
   'Interrupts the machine’s pulses, stopping it on the spot, then restores them. After restoring, the program resumes with CALCULEAZA.',
   'The inscriptions IMPULSURI, INTRERUPE (partly worn) and RESTABILESTE are on the panel. The effect in the emulator (stop, OPRIT lamp on) is GUESSED. Choosing a program restores the pulses.'))
e('lamp-overflow', 'DEDUS', ['model3d', 'semantica'],
  ('În caz de depășirea capacității registrului — becurile',
   'Arată ce face mașina când un rezultat nu încape în registru: se oprește (roșu) sau continuă (verde).',
   'Inscripția „IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI — SE OPRESTE / NU SE OPRESTE” e pe panou (SIGUR); legătura becurilor cu alegerea e DEDUSĂ.'),
  ('On register overflow — lamps',
   'Show what the machine does when a result does not fit in the register: it stops (red) or carries on (green).',
   'The inscription “IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI — SE OPRESTE / NU SE OPRESTE” (on register overflow — stop / do not stop) is on the panel (CERTAIN); the link between lamps and choice is DEDUCED.'))
e('switch-overflow-0', 'DEDUS', ['model3d', 'semantica'],
  ('SE OPRESTE (la depășire)',
   'La depășire, mașina se oprește și aprinde DEPASIT CAPACITATEA REGISTRULUI. Emulatorul pornește așa.',
   'Numerele mașinii sunt fracții între −1 și 1; o sumă care iese din interval „depășește capacitatea registrului”. Oprirea e DEDUSĂ din inscripție.'),
  ('SE OPRESTE (on overflow: stop)',
   'On overflow the machine stops and lights DEPASIT CAPACITATEA REGISTRULUI. The emulator starts in this mode.',
   'The machine’s numbers are fractions between −1 and 1; a sum outside that range “exceeds the register capacity”. The stop is DEDUCED from the inscription.'))
e('switch-overflow-1', 'DEDUS', ['model3d', 'semantica'],
  ('NU SE OPRESTE (la depășire)',
   'La depășire, mașina nu se oprește; becul de depășire se aprinde, iar calculul continuă cu rezultatul trunchiat.',
   'Continuarea e DEDUSĂ din inscripție; forma exactă a rezultatului după depășire e GHICITĂ.'),
  ('NU SE OPRESTE (on overflow: do not stop)',
   'On overflow the machine does not stop; the overflow lamp lights and the computation carries on with a truncated result.',
   'Carrying on is DEDUCED from the inscription; the exact result after overflow is GUESSED.'))
for i, (rt, rs, et, es, st) in enumerate([
    ('DEPASIT CAPACITATEA REGISTRULUI', 'Se aprinde când un rezultat iese din intervalul −1 … 1 al numerelor mașinii (o „depășire”).', 'DEPASIT CAPACITATEA REGISTRULUI (register capacity exceeded)', 'Lights when a result falls outside the machine’s number range −1 … 1 (an “overflow”).', 'MIXT'),
    ('HIRTIA AGATATA', 'Se aprinde când cititorul nu mai are bandă: banda s-a terminat sau s-a agățat. Mașina se oprește.', 'HIRTIA AGATATA (paper jammed)', 'Lights when the reader has no more tape: the tape has ended or jammed. The machine stops.', 'MIXT'),
    ('OPRIT', 'Mașina e oprită: a executat instrucțiunea O, s-a oprit la o problemă sau a fost oprită de la pupitru.', 'OPRIT (stopped)', 'The machine is stopped: it executed instruction O, stopped on a problem or was stopped from the console.', 'MIXT')]):
    e(f'lamp-indicators-{i}', st, ['model3d', 'photo2011', 'semantica'],
      (rt, rs, 'Inscripția și becul (roșu) sunt pe panou și în fotografia din 2011 (SIGUR). Când anume se aprinde e DEDUS din inscripție.'),
      (et, es, 'The inscription and the (red) lamp are on the panel and in the 2011 photograph (CERTAIN). Exactly when it lights is DEDUCED from the inscription.'))
e('lamp-compute', 'DEDUS', ['model3d', 'photo2011', 'semantica'],
  ('CALCULEAZA — becurile',
   'Arată modul de lucru: calcul automat sau câte o singură instrucțiune.',
   'Becurile verzi deasupra butoanelor AUTOMAT și INSTRUCTIE UNICA se văd în fotografia din 2011 (SIGUR); semnificația e DEDUSĂ.'),
  ('CALCULEAZA lamps (compute)',
   'Show the working mode: automatic computation or one instruction at a time.',
   'The green lamps above the AUTOMAT and INSTRUCTIE UNICA buttons are visible in the 2011 photograph (CERTAIN); their meaning is DEDUCED.'))
e('switch-compute-0', 'MIXT', ['model3d', 'baltacLab', 'semantica'],
  ('CALCULEAZA AUTOMAT',
   'Pornește programul de la adresa din RAI și îl lasă să meargă până se oprește. Încercați!',
   'Butonul există (SIGUR, inscripția); Lucrarea 7 (p. 6) vorbește despre execuția automată și pas cu pas. Efectul exact e DEDUS. La viteza din 1962, mașina făcea cam 50 de instrucțiuni pe secundă, pentru că aștepta tamburul să se rotească.'),
  ('CALCULEAZA AUTOMAT (compute: automatic)',
   'Starts the program at the address in RAI and lets it run until it stops. Try it!',
   'The button exists (CERTAIN, the inscription); lab sheet 7 (p. 6) mentions automatic and step-by-step execution. The exact effect is DEDUCED. At 1962 speed the machine did about 50 instructions per second, because it waited for the drum to turn.'))
e('switch-compute-1', 'MIXT', ['model3d', 'baltacLab', 'semantica'],
  ('CALCULEAZA INSTRUCTIE UNICA',
   'Execută o singură instrucțiune și se oprește, ca să se poată urmări pe becuri ce s-a schimbat.',
   'Butonul există (SIGUR); efectul (exact o instrucțiune) e DEDUS din inscripție și din Lucrarea 7, p. 6.'),
  ('CALCULEAZA INSTRUCTIE UNICA (compute: single instruction)',
   'Executes a single instruction and stops, so the changes can be followed on the lamps.',
   'The button exists (CERTAIN); the effect (exactly one instruction) is DEDUCED from the inscription and from lab sheet 7, p. 6.'))

# ---------------- panoul stâng ----------------
e('lamp-uop', 'MIXT', ['model3d', 'baltacLab', 'wikiRO', 'semantica'],
  ('Grila de microoperații',
   'Fiecare bec are deasupra numele unei microoperații. Un bec clipește când microoperația lui se execută.',
   'Numele celulelor sunt citite de pe textura panoului (SIGUR, cu câteva nesigure). Doar adunarea era cablată și nu are bec; restul instrucțiunilor erau microprogramate (schema Wilkes). Ce microoperații alcătuiesc fiecare instrucțiune și în ce ordine e DEDUS — paginile Lucrării 7 care le descriau s-au pierdut. Grila completă e în documentație, capitolul 4.'),
  ('The micro-operation grid',
   'Each lamp has the name of a micro-operation above it. A lamp flashes when its micro-operation is executed.',
   'The cell names are read from the panel texture (CERTAIN, a few uncertain). Only addition was hard-wired and has no lamp; the other instructions were microprogrammed (the Wilkes scheme). Which micro-operations make up each instruction, and in what order, is DEDUCED — the pages of lab sheet 7 that described them are lost. The full grid is in chapter 4 of the documentation.'))
e('lamp-pilot', 'GHICIT', ['model3d', 'semantica'],
  ('Cele trei becuri din mijlocul panoului stâng',
   'Becuri fără inscripție. Ce arătau nu se știe; în emulator rămân stinse.',
   'Becurile sunt în modelul 3D (SIGUR); rostul lor e necunoscut — GHICIT.'),
  ('The three lamps in the middle of the left panel',
   'Lamps without an inscription. What they showed is unknown; in the emulator they stay off.',
   'The lamps are in the 3D model (CERTAIN); their purpose is unknown — GUESSED.'))
e('lamp-generator', 'GHICIT', ['model3d', 'semantica'],
  ('GENERATOR PRINCIPAL — becurile',
   'Becurile generatorului de impulsuri care dădea ritmul mașinii. Ce arăta fiecare nu se știe; în emulator stau fixe.',
   'Inscripțiile generatorului (IMPULSURI, FRECVENȚĂ FIN, FRECVENȚĂ TREPTE, p, q, ⎍/⊔) sunt pe panou (SIGUR). Starea becurilor din emulator (1, 3, 5 aprinse) e GHICITĂ.'),
  ('GENERATOR PRINCIPAL — lamps (main generator)',
   'The lamps of the pulse generator that set the machine’s rhythm. What each showed is unknown; in the emulator they stay fixed.',
   'The generator inscriptions (IMPULSURI, FRECVENȚĂ FIN, FRECVENȚĂ TREPTE — pulses, fine frequency, frequency steps — p, q, ⎍/⊔) are on the panel (CERTAIN). The lamp states in the emulator (1, 3, 5 lit) are GUESSED.'))
e('switch-generator', 'MIXT', ['model3d', 'semantica'],
  ('GENERATOR PRINCIPAL — comutatoarele',
   'Alegeau sursa și frecvența impulsurilor (inclusiv un generator extern). În emulator nu fac nimic.',
   'Inscripțiile („IMPULSURI”, „DE LA GENER. EXTERN”, „DECLANSARE MANUALA SAU”, 1 · 2 · 3) sunt pe panou, unele greu de citit (SIGUR / nesigur). Funcția precisă e GHICITĂ.'),
  ('GENERATOR PRINCIPAL — switches (main generator)',
   'They chose the source and frequency of the pulses (including an external generator). In the emulator they do nothing.',
   'The inscriptions (“IMPULSURI”, “DE LA GENER. EXTERN” — from external generator, “DECLANSARE MANUALA SAU” — manual triggering or, 1 · 2 · 3) are on the panel, some hard to read (CERTAIN / uncertain). Their precise function is GUESSED.'))
e('knob', 'MIXT', ['model3d', 'semantica'],
  ('FRECVENȚĂ FIN — butonul rotativ',
   'Butonul rotativ al generatorului; după inscripție, reglajul fin al frecvenței impulsurilor. În emulator nu face nimic.',
   'Butonul e în modelul 3D, sub inscripția FRECVENȚĂ FIN (SIGUR); funcția e DEDUSĂ din inscripție.'),
  ('FRECVENȚĂ FIN — the rotary knob (fine frequency)',
   'The generator’s rotary knob; going by the inscription, the fine adjustment of the pulse frequency. In the emulator it does nothing.',
   'The knob is in the 3D model, under the inscription FRECVENȚĂ FIN (CERTAIN); its function is DEDUCED from the inscription.'))

# ---------------- panoul din mijloc ----------------
e('meter', 'GHICIT', ['photo2011', 'semantica'],
  ('Voltmetru',
   'Arăta una din tensiunile de alimentare ale tuburilor. Ce tensiune măsura fiecare și scalele nu se cunosc.',
   'Aparatele și litera V de pe cadrane se văd în fotografia din 2011 (SIGUR). Cifrele de pe cadrane nu se pot citi; cele patru voltmetre de sus sunt desenate cu scala 0–250 V, după o amintire transmisă proiectului (nu după o sursă scrisă) și după tensiunile obișnuite pentru tuburi (GHICIT). Acele stau fix.'),
  ('Voltmeter',
   'Showed one of the supply voltages for the tubes. Which voltage each one measured, and the scales, are unknown.',
   'The meters and the letter V on the dials are visible in the 2011 photograph (CERTAIN). The figures on the dials cannot be read; the four top voltmeters are drawn with a 0–250 V scale, after a recollection passed on to the project (not a written source) and typical tube voltages (GUESSED). The needles are fixed.'))
e('meter-5', 'DEDUS', ['photo2011', 'wikiRO', 'semantica'],
  ('Voltmetrul care lipsește azi',
   'În 2011 locul lui era o ramă goală; o fotografie din 1961 îl arată la locul lui. Aici e redesenat după vecinii lui.',
   'Rama goală se vede în fotografia din 2011 (SIGUR). Aspectul aparatului e DEDUS din celelalte trei din același rând.'),
  ('The voltmeter missing today',
   'In 2011 its place was an empty bezel; a 1961 photograph shows it in place. Here it is redrawn after its neighbours.',
   'The empty bezel is visible in the 2011 photograph (CERTAIN). The look of the meter is DEDUCED from the other three in the same row.'))
e('selector', 'GHICIT', ['photo2011', 'semantica'],
  ('Selectorul',
   'Buton rotativ mic; probabil alegea ce tensiune arată un voltmetru. Funcția e ghicită.',
   'Butonul se vede în fotografia din 2011 (SIGUR); funcția e GHICITĂ.'),
  ('Selector',
   'A small rotary knob; it probably chose which voltage a meter displayed. Its function is guessed.',
   'The knob is visible in the 2011 photograph (CERTAIN); its function is GUESSED.'))
e('power', 'GHICIT', ['photo2011', 'semantica'],
  ('Comutatorul rotativ mare',
   'Mâner negru pe un disc alb; probabil pornirea alimentării mașinii. Funcția e ghicită.',
   'Comutatorul se vede în fotografia din 2011 (SIGUR); funcția e GHICITĂ.'),
  ('Large rotary switch',
   'A black handle on a white disc; probably the machine’s power switch. Its function is guessed.',
   'The switch is visible in the 2011 photograph (CERTAIN); its function is GUESSED.'))
e('toggle', 'GHICIT', ['photo2011', 'semantica'],
  ('Comutatoare mici',
   'Comutatoare basculante ale panoului din mijloc. Funcția lor nu se cunoaște.',
   'Se văd în fotografia din 2011 (SIGUR); funcția e GHICITĂ. În emulator nu fac nimic.'),
  ('Small switches',
   'Toggle switches on the middle panel. Their function is unknown.',
   'They are visible in the 2011 photograph (CERTAIN); their function is GUESSED. In the emulator they do nothing.'))

# ---------------- perifericele ----------------
e('view3d', 'MIXT', ['model3d', 'semantica'],
  ('Vederea 3D',
   'Butonul 3D arată pupitrul ca model tridimensional, pe care îl puteți roti și apropia; becurile lui se aprind după mașina emulată, la fel ca pe panourile desenate. Butonul 2D vă întoarce la pupitrul desenat.',
   '- **Modelul**: „MECIPT-1” de marius0198 (Sketchfab, 2020, CC BY 4.0), același din care s-au redesenat panourile; texturile panourilor laterale sunt cele ale modelului; din textura panoului drept am scos pata albă lăsată de blițul fotografiei, care părea o lumină venită de nicăieri.\n- **Becurile** modelului (161, câte unul pentru fiecare bec al emulatorului) se aprind după aceeași stare a mașinii și cu aceeași inerție ca în 2D. Legătura bec–obiect vine din `positions.json`, unde fiecare bec păstrează numele obiectului din model.\n- **Comutatoarele se apasă și în 3D**: un clic scurt sau o atingere pe manetă face exact ce face clicul pe comutatorul desenat (în modul Explică, îl explică); tragerea doar rotește. Manetele se înclină în sus sau în jos după starea lor, ca în 2D; cele 63 de comutatoare sunt legate de obiectele lor din model tot prin `positions.json`. Înclinarea e aleasă după ochi.\n- **Zonele**: butoanele de deasupra modelului (CALCULEAZĂ, Comenzi, Registrul RAI, Registrul M, RI și RA, Generatorul, Voltmetrele) duc camera drept în fața acelei părți, destul de aproape ca manetele să se nimerească ușor; „Tot pupitrul” o întoarce. O rotire cu mâna scoate zona din buton.\n- Rotire: mouse-ul sau un deget; apropiere: rotița (spre punctul arătat) sau două degete.\n- Modelul și biblioteca three.js (MIT) se încarcă abia la prima apăsare pe 3D (cam 4,5 MB). Dacă browserul nu are WebGL, pagina spune asta și rămâne în 2D.'),
  ('3D view',
   'The 3D button shows the console as a three-dimensional model you can rotate and zoom; its lamps light up following the emulated machine, just like on the drawn panels. The 2D button takes you back to the drawn console.',
   '- **The model**: “MECIPT-1” by marius0198 (Sketchfab, 2020, CC BY 4.0), the same one the panels were redrawn from; the side panels’ textures are the model’s own; we removed from the right panel’s texture the white spot left by the photograph’s flash, which looked like a light coming from nowhere.\n- The model’s **lamps** (161, one for every lamp of the emulator) light up from the same machine state and with the same inertia as in 2D. The lamp–object link comes from `positions.json`, where each lamp keeps the name of its object in the model.\n- **The switches can be pressed in 3D too**: a short click or a tap on a lever does exactly what clicking the drawn switch does (in Explain mode, it explains it); dragging only rotates. The levers tilt up or down following their state, as in 2D; the 63 switches are tied to their model objects through `positions.json` as well. The tilt angle is chosen by eye.\n- **Zones**: the buttons above the model (CALCULEAZĂ, Commands, RAI register, M register, RI and RA, Generator, Voltmeters) bring the camera straight in front of that part, close enough for the levers to be easy to hit; “Whole console” takes it back. Rotating by hand releases the zone button.\n- Rotate: the mouse or a finger; zoom: the wheel (towards the pointer) or two fingers.\n- The model and the three.js library (MIT) load only at the first press on 3D (about 4.5 MB). If the browser has no WebGL, the page says so and stays in 2D.'))
e('drum', 'MIXT', ['photoDrum2015', 'farcas2005', 'baltac2011', 'semantica'],
  ('Tamburul magnetic',
   'Singura memorie a mașinii: un tambur care se rotea de 50 de ori pe secundă, cu 1024 de cuvinte de 31 de biți scrise magnetic jur-împrejurul lui. De la el vine zumzetul.',
   '- **1024 de cuvinte de 31 de biți**, așezate jur-împrejurul tamburului; **50 de rotații pe secundă**. De aceea mașina făcea cam 50 de instrucțiuni pe secundă: aștepta ca fiecare cuvânt să ajungă sub capete — SIGUR (Farcaș; Baltac).\n- Era memoria internă și externă, deodată: programele, „rudimentul de sistem de operare” și datele stăteau toate aici. De obicei păstra informația și peste noapte, după deconectare — SIGUR (Farcaș).\n- A venit gratuit din Ungaria, de la Institutul de Cercetări în Cibernetică al Academiei Ungare, fabricat după licența calculatorului sovietic M-3: „o instalație cât un dulăpaș”. Electronica de comandă, cu 200 de tuburi, s-a făcut la Timișoara — SIGUR (Farcaș; Baltac, Facsimilul 8).\n- Adresele pare pe o jumătate a tamburului, cele impare pe cealaltă, ca programele să nu aștepte o rotație întreagă — DEDUS (Baltac, Facsimilul 8).\n- **Cum arată** — SIGUR, după fotografiile din 2015 de la Muzeul Banatului: tamburul stă vertical deasupra unui dulăpaș auriu pe roți, cu blocurile capetelor de citire și scriere jur-împrejurul cilindrului de oțel, butucul și conul deasupra și o ungătoare de alamă alături. Pe panoul crem: un bec verde, un comutator rotativ și două becuri cu plăcuțe în maghiară, **FŰTÉS** („încălzire”) și **TÖRLÉS** („ștergere”), fiecare cu un comutator.\n- **GHICIT**: becul verde aprins cât mașina e sub tensiune; FŰTÉS și TÖRLÉS stinse (nu se știe când se aprindeau); comutatoarele nu fac nimic. Rotația e încetinită în desen (la 50 de rotații pe secundă ochiul n-ar vedea decât o pată).\n\nZumzetul de 50 Hz (butonul 🔊) e sunetul acestui tambur.'),
  ('Magnetic drum',
   'The machine’s only memory: a drum spinning 50 times a second, with 1024 words of 31 bits written magnetically around it. The hum comes from it.',
   '- **1024 words of 31 bits**, laid out around the drum; **50 revolutions a second**. That is why the machine did about 50 instructions a second: it waited for each word to come under the heads — CERTAIN (Farcaș; Baltac).\n- It was the internal and external memory at once: programs, the “rudiment of an operating system” and the data all lived here. It usually kept its contents overnight, after power-off — CERTAIN (Farcaș).\n- It came free of charge from Hungary, from the Cybernetics Research Institute of the Hungarian Academy, built under the licence of the Soviet M-3 computer: “an installation the size of a small cabinet”. The control electronics, with 200 valves, were made in Timișoara — CERTAIN (Farcaș; Baltac, facsimile 8).\n- Even addresses on one half of the drum, odd ones on the other, so programs did not wait a whole revolution — DEDUCED (Baltac, facsimile 8).\n- **What it looks like** — CERTAIN, from the 2015 photographs at the Museum of Banat: the drum stands upright on a gold-painted cabinet on wheels, with the read/write head blocks around the steel cylinder, the hub and cone on top and a brass oil cup beside it. On the cream panel: a green lamp, a rotary switch and two lamps with Hungarian labels, **FŰTÉS** (“heating”) and **TÖRLÉS** (“erase”), each with a switch.\n- **GUESSED**: the green lamp lit while the machine is powered; FŰTÉS and TÖRLÉS off (it is not known when they lit); the switches do nothing. The rotation is slowed down in the drawing (at 50 revolutions a second the eye would see only a blur).\n\nThe 50 Hz hum (the 🔊 button) is the sound of this drum.'))
e('drum-map', 'MIXT', ['baltac2011', 'semantica'],
  ('Harta tamburului',
   'Inelul de lângă tambur arată toate cele 1024 de cuvinte ale memoriei, fiecare cu culoarea provenienței lui, ca în tamburul din Atelier. Când se încarcă o bandă, inelul se umple pe măsură ce cuvintele ajung pe tambur.',
   '- **Culorile** sunt cele din Atelier: verde = original, galben-verzui = dedus, ocru = reconstrucție, roz = ghicit, mov = modificat de vizitator, albastru = scris de program în timpul rulării; gri închis = gol.\n- **Semnul galben** arată instrucțiunea care se execută (adresa din RAI), cât timp mașina rulează.\n- **Așezarea**: adresele pare pe jumătatea dreaptă a inelului, cele impare pe cea stângă, ca pe tamburul adevărat, unde stăteau pe jumătăți diferite ca programele să nu aștepte o rotație întreagă — DEDUS (Baltac, Facsimilul 8). Adresa 0000 e sus.\n- Harta e o **unealtă a emulatorului**, nu o piesă a mașinii: pe MECIPT-1 conținutul tamburului nu se vedea nicăieri.\n- Dungile care trec pe cilindrul desenat arată doar că tamburul se rotește (încetinit: la 50 de rotații pe secundă ochiul n-ar vedea decât o pată); desenul lor e GHICIT.'),
  ('Drum map',
   'The ring next to the drum shows all 1024 words of memory, each in the colour of its provenance, as in the Workshop’s drum. When a tape loads, the ring fills up as the words reach the drum.',
   '- **The colours** are the Workshop’s: green = original, yellow-green = deduced, ochre = reconstruction, pink = guessed, purple = modified by the visitor, blue = written by the program while running; dark grey = empty.\n- **The yellow mark** shows the instruction being executed (the address in RAI), while the machine runs.\n- **Layout**: even addresses on the right half of the ring, odd ones on the left, as on the real drum, where they lay on different halves so programs did not wait a whole revolution — DEDUCED (Baltac, facsimile 8). Address 0000 is at the top.\n- The map is an **emulator tool**, not a part of the machine: on MECIPT-1 the drum’s contents were not shown anywhere.\n- The stripes passing over the drawn cylinder only show that the drum turns (slowed down: at 50 revolutions a second the eye would see only a blur); their drawing is GUESSED.'))
e('tape', 'MIXT', ['farcas2005', 'wikiRO', 'geier1961', 'semantica'],
  ('Cititorul de bandă perforată',
   'Programele și datele intrau pe bandă de telex cu 5 canale. Gaura înseamnă 0. Un cuvânt ocupă 6 rânduri de bandă.',
   '- Bandă de telex cu 5 canale și un canal de ghidaj; **perforația = „0”**; citire mecanică — SIGUR (Farcaș, Wikipedia RO).\n- Instrucțiunea CIT citește **un rând** (5 biți) și îl pune aliniat la dreapta — SIGUR (tabelul Geier).\n- Un cuvânt = **6 rânduri** de câte 5 biți, m1–m5 primul — DEDUS (Geier: „două instrucțiuni … prin doar șase caractere”); semnul m0 nu e pe bandă.\n- Canalul 1 = bitul cel mai semnificativ al rândului — GHICIT.\n- Așezarea canalelor pe hârtie: 1 · 2 · ghidaj · 3 · 4 · 5 — DEDUS din banda de telex.\n- Când banda se termină: HIRTIA AGATATA — DEDUS.\n\nExemplul complet (cuvântul 05 1626 25 1512 desenat pe 6 rânduri) e în documentație, capitolul 5. Banda INEX-1 originală nu s-a păstrat; cea din pagină e **reconstruită** (rutinele scrise acum după punctele de intrare din Facsimilul 5) și o încarcă preîncărcătorul original, de la 0010, ca în 1962.'),
  ('Punched-tape reader',
   'Programs and data came in on 5-channel telex tape. A hole means 0. One word takes 6 rows of tape.',
   '- 5-channel telex tape with a feed-hole track; **a punched hole = “0”**; mechanical reading — CERTAIN (Farcaș, Romanian Wikipedia).\n- The CIT instruction reads **one row** (5 bits) and stores it right-aligned — CERTAIN (Geier’s table).\n- One word = **6 rows** of 5 bits, m1–m5 first — DEDUCED (Geier: “two 15-bit instructions … by just six characters”); the sign bit m0 is not on the tape.\n- Channel 1 = the most significant bit of the row — GUESSED.\n- Channel layout on the paper: 1 · 2 · feed · 3 · 4 · 5 — DEDUCED from telex tape.\n- When the tape ends: HIRTIA AGATATA (paper jammed) — DEDUCED.\n\nThe full example (the word 05 1626 25 1512 drawn on 6 rows) is in chapter 5 of the documentation. The original INEX-1 tape has not survived; the one on the page is **reconstructed** (routines written now from the entry points in facsimile 5) and is loaded by the original preloader, from 0010, as in 1962.'))
e('sheet', 'MIXT', ['farcas2005', 'geier1961', 'baltacLab', 'wikiRO', 'semantica'],
  ('Mașina de scris',
   'Rezultatele se tipăreau pe o mașină de scris electrică obișnuită, acționată de electromagneți puși deasupra clapelor.',
   '- Mașina de scris electrică cu electromagneți deasupra clapelor, hârtie A4/A3 — SIGUR (Farcaș).\n- Instrucțiunea AC cu subcodul 0136 tipărește o cifră din s0…s3, cu 0133 o literă din s0…s4 — SIGUR (tabelul Geier).\n- Seturile de caractere — SIGUR (Baltac, lucrarea de laborator L6, prin Wikipedia RO): cifre, spațiu, minus, punct, virgulă și întoarcerea carului (codul 14 nu era folosit); spațiu, cele 26 de litere englezești și ă, î, ș, ț (codul 31 nu era folosit).\n- Cifra zero se bate „o”, ca în facsimilele 3 și 4 — DEDUS.\n- Care cod e care literă sau semn — GHICIT (tabelul nu s-a păstrat); spațiul și rândul nou sunt cele folosite de programul de retipărire.\n- Viteza, cam 10 caractere pe secundă — GHICIT.\n\nProgramul original de retipărire din 6.09.1962 (Facsimil 4) își tipărește aici propriul listing exact cum apare în facsimil.'),
  ('Typewriter',
   'Results were printed on an ordinary electric typewriter, driven by electromagnets placed above the keys.',
   '- An electric typewriter with electromagnets above the keys, A4/A3 paper — CERTAIN (Farcaș).\n- The AC instruction with sub-code 0136 prints a digit from s0…s3, with 0133 a letter from s0…s4 — CERTAIN (Geier’s table).\n- The character sets — CERTAIN (Baltac, lab sheet L6, via the Romanian Wikipedia): digits, space, minus, point, comma and carriage return (code 14 not used); space, the 26 English letters and ă, î, ș, ț (code 31 not used).\n- The digit zero is struck as “o”, as in facsimiles 3 and 4 — DEDUCED.\n- Which code is which letter or sign — GUESSED (the table is lost); space and newline are those used by the reprinting program.\n- The speed, about 10 characters a second — GUESSED.\n\nThe original reprinting program of 6 September 1962 (facsimile 4) prints its own listing here exactly as it appears in the facsimile.'))
e('provenance', 'MIXT', ['baltac2011', 'semantica'],
  ('Proveniența programului',
   'Arată de unde vine fiecare cuvânt al programului: ORIGINAL (din documente din 1962), DEDUS, RECONSTRUCȚIE sau GHICIT.',
   '- **ORIGINAL** — transcris dintr-un document de epocă, cu trimitere la facsimil (de exemplu Facsimilul 4 din cartea lui V. Baltac).\n- **DEDUS** — rezultă din documente, dar nu e scris în ele (de exemplu o cifră corectată de mână).\n- **RECONSTRUCȚIE** — scris acum, după logica programului, pentru că lipsește din document (de exemplu constantele citite de retipărire).\n- **GHICIT** — necesar ca să meargă, fără sursă.\n\nImaginile facsimilelor nu sunt reproduse aici; ele se găsesc în cartea lui Vasile Baltac.'),
  ('Program provenance',
   'Shows where each word of the program comes from: ORIGINAL (from 1962 documents), DEDUCED, RECONSTRUCTION or GUESSED.',
   '- **ORIGINAL** — transcribed from a period document, with a reference to the facsimile (e.g. facsimile 4 in V. Baltac’s book).\n- **DEDUCED** — follows from the documents but is not written in them (e.g. a digit corrected by hand).\n- **RECONSTRUCTION** — written now, following the program’s logic, because it is missing from the document (e.g. the constants read by the reprinting program).\n- **GUESSED** — needed for it to work, without a source.\n\nThe facsimile images are not reproduced here; they are in Vasile Baltac’s book.'))


# ---------------- programele reconstruite (Planul 6) ----------------
e('program-inex1', 'MIXT', ['baltac2011', 'semantica'],
  ('Preîncărcătorul INEX-1 și banda INEX-1',
   'Preîncărcătorul e ORIGINAL (Facsimilul 5); banda INEX-1 e RECONSTRUITĂ: rutinele de tipărire și de citire, scrise acum la punctele de intrare din facsimil.',
   '- **ORIGINAL**: preîncărcătorul, 0000–0001 și 0010–0015, cu procedura „se pune banda INEX-1 în cititor … și se pornește calculatorul de la 0010”; cuvântul 0001 e DEDUS (cifra corectată de mână).\n- **RECONSTRUCȚIE**: banda, 190 de cuvinte (0002–0277, 1140 de rânduri). Preîncărcătorul o citește în cam 3 minute și se oprește cu HIRTIA AGATATA la capăt.\n- Punctele de intrare sunt SIGURE (Facsimilul 5): 0040 (0026) citirea benzilor de la pupitru, 0025 ca program, 0133 formatul, 0134 întregi, 0135 subunitare, 0132 rânduri, 0136 spații, 0246 de la A la B.\n- **GHICIT**: cum se cheamă rutinele (întoarcerea prin celula V = 0002, argumentul în S) și valorile implicite (3 cifre la întregi, 9 zecimale).\n\nDetaliile sunt în documentație, capitolul 6, și în Semantica, secțiunea „INEX-1 reconstruit”.'),
  ('The INEX-1 preloader and the INEX-1 tape',
   'The preloader is ORIGINAL (facsimile 5); the INEX-1 tape is RECONSTRUCTED: printing and reading routines written now at the entry points given in the facsimile.',
   '- **ORIGINAL**: the preloader, 0000–0001 and 0010–0015, with the procedure “put the INEX-1 tape in the reader … and start the computer from 0010”; word 0001 is DEDUCED (a digit corrected by hand).\n- **RECONSTRUCTION**: the tape, 190 words (0002–0277, 1140 rows). The preloader reads it in about 3 minutes and stops with HIRTIA AGATATA (paper jammed) at its end.\n- The entry points are CERTAIN (facsimile 5): 0040 (0026) reading tapes from the console, 0025 as a program, 0133 format, 0134 integers, 0135 fractions, 0132 lines, 0136 spaces, 0246 from A to B.\n- **GUESSED**: how the routines are called (return through cell V = 0002, the argument in S) and the defaults (3 digits for integers, 9 decimals).\n\nThe details are in chapter 6 of the documentation and in Semantics, section “INEX-1 reconstructed”.'))
e('program-sinus-1962', 'MIXT', ['baltac2011', 'semantica'],
  ('Tabelul de sinus din 21 februarie 1962',
   'Rezultatul e ORIGINAL (Facsimilul 3: 45 de valori, 1°–45°, cu 9 zecimale); programul s-a pierdut și e RECONSTRUIT, cu o metodă care reproduce 44 din cele 45 de valori.',
   '- **Rezultatul**: Facsimilul 3, „Tabel de sinus dela 1° la 45° calculat de MECIPT-1”, 21.02.1962 — tipărit cu „o” pentru zero și un semn după fiecare număr.\n- **Metoda (RECONSTRUCȚIE, găsită prin căutare)**: toate valorile tipărite sunt impare în ultima cifră binară, deci mașina calcula sin x / 2 și tipărea dublul minus o unitate. Argumentul e n·π/360 (π/360 trunchiat), iar seria Taylor se ia termen cu termen, fiecare termen trunchiat; doar w² și primul raport (2/3) sunt rotunjite.\n- **Potrivirea**: 44 de valori ies cifră cu cifră ca în facsimil. **sin 32°** iese o,52991926o în loc de o,529919258 (adevărat: 0,5299192642); diferența nu se explică și e lăsată la vedere.\n- Nicio regulă a aritmeticii mașinii n-a trebuit schimbată pentru asta.'),
  ('The sine table of 21 February 1962',
   'The result is ORIGINAL (facsimile 3: 45 values, 1°–45°, with 9 decimals); the program is lost and RECONSTRUCTED, with a method that reproduces 44 of the 45 values.',
   '- **The result**: facsimile 3, “Sine table from 1° to 45° computed by MECIPT-1”, 21 Feb 1962 — printed with “o” for zero and a mark after every number.\n- **The method (RECONSTRUCTION, found by search)**: every printed value is odd in its last binary digit, so the machine computed sin x / 2 and printed twice that minus one unit. The argument is n·π/360 (π/360 truncated), and the Taylor series is taken term by term, each term truncated; only w² and the first ratio (2/3) are rounded.\n- **The match**: 44 values come out digit for digit as in the facsimile. **sin 32°** comes out o,52991926o instead of o,529919258 (true: 0.5299192642); the difference is unexplained and left in plain view.\n- No rule of the machine’s arithmetic had to change for this.'))
e('program-vidraru', 'GHICIT', ['farcas1964', 'semantica'],
  ('Barajul Vidraru — calcul ilustrativ',
   'Calcul ilustrativ în spiritul celui efectuat pentru barajul Vidraru; cifrele nu sunt cele reale. Nici programul, nici datele nu s-au păstrat.',
   '- **Metoda**: arcele încastrate, mult simplificat (ideea, după articolul lui Farcaș din 1964). 11 arce orizontale, de la coronament la fundație.\n- **Datele**: înălțimea de 166 m și grosimile de ~6 m sus și ~25 m jos sunt publice; cota coronamentului (834 m) și razele arcelor (160 m sus, 80 m jos) sunt GHICITE.\n- **Coloanele**, pe fiecare rând (un arc): cota (m); adâncimea /1000, egală cu presiunea apei p /1000 (tf/m²); forța din arc N = p·R /10⁶ (tf/m); efortul din beton σ = N/t /10⁴ (tf/m²). Numerele sunt scalate ca să încapă în fracțiile mașinii, cum făceau programatorii atunci.\n- Programul (RECONSTRUCȚIE) tipărește cu rutinele INEX-1 și e verificat față de un calcul independent făcut cu aceeași aritmetică.'),
  ('Vidraru dam — illustrative calculation',
   'Illustrative calculation in the spirit of the one made for the Vidraru dam; the figures are not the real ones. Neither the program nor the data have survived.',
   '- **The method**: fixed arches, much simplified (the idea, after Farcaș’s 1964 article). 11 horizontal arches, from the crest to the foundation.\n- **The data**: the 166 m height and the ~6 m top and ~25 m bottom thicknesses are public; the crest elevation (834 m) and the arch radii (160 m at the top, 80 m at the bottom) are GUESSED.\n- **The columns**, on each line (one arch): elevation (m); depth /1000, equal to the water pressure p /1000 (tf/m²); the arch force N = p·R /10⁶ (tf/m); the concrete stress σ = N/t /10⁴ (tf/m²). The numbers are scaled to fit the machine’s fractions, as programmers did then.\n- The program (RECONSTRUCTION) prints with the INEX-1 routines and is checked against an independent calculation done with the same arithmetic.'))
e('program-romexpo', 'GHICIT', ['baltac2011', 'semantica'],
  ('Cupola Romexpo — calcul ilustrativ',
   'Calcul ilustrativ în spiritul celui efectuat în 1963 pentru cupola Romexpo; cifrele nu sunt cele reale. Calculul original (iulie 1963, programator V. Baltac) nu s-a păstrat.',
   '- **Modelul**: o cupolă sferică cu diametrul public de 93,5 m; săgeata (24 m), unghiul de la vârf la bază (~0,949 rad, calculat dinainte, ca din tabele) și cele 32 de meridiane sunt GHICITE. Raza sferei se calculează în program: R = (a² + f²)/(2f).\n- **Coloanele**, pe fiecare rând (un inel, de la vârf spre bază): numărul inelului; unghiul φ (radiani); raza inelului r = R·sin φ /100 (m); lungimea elementului de inel c = 2·r·sin(π/32) /100 (m).\n- Sinusul se calculează cu aceeași metodă ca tabelul din 1962.\n- Programul (RECONSTRUCȚIE) tipărește cu rutinele INEX-1 și e verificat față de un calcul independent făcut cu aceeași aritmetică.'),
  ('Romexpo dome — illustrative calculation',
   'Illustrative calculation in the spirit of the one made in 1963 for the Romexpo dome; the figures are not the real ones. The original calculation (July 1963, programmer V. Baltac) has not survived.',
   '- **The model**: a spherical dome with the public diameter of 93.5 m; the rise (24 m), the angle from the top to the base (~0.949 rad, worked out beforehand, as from tables) and the 32 meridians are GUESSED. The sphere’s radius is computed in the program: R = (a² + f²)/(2f).\n- **The columns**, on each line (one ring, from the top down): ring number; the angle φ (radians); the ring radius r = R·sin φ /100 (m); the ring element length c = 2·r·sin(π/32) /100 (m).\n- The sine is computed with the same method as the 1962 table.\n- The program (RECONSTRUCTION) prints with the INEX-1 routines and is checked against an independent calculation done with the same arithmetic.'))

# ---------------- Atelierul ----------------
e('atelier-editor', 'MIXT', ['baltac2011', 'geier1961', 'semantica'],
  ('Programul de pe tambur',
   'Cuvintele de pe tambur, scrise ca în listingurile din 1962: adresa, apoi cele două instrucțiuni. Puteți schimba orice cuvânt; schimbarea primește eticheta MODIFICAT.',
   'Notația e cea a listingurilor de epocă, `AAAA  c1 aaaa  c2 aaaa` în octal — SIGUR: e chiar ieșirea programului original de retipărire din 1962 (Facsimil 4). Mnemonicele sunt din tabelul Geier (1961).\n\nEditorul e o unealtă a emulatorului, nu a mașinii: programatorii din 1962 scriau pe hârtie și introduceau cuvintele de la pupitru sau de pe bandă. Ce schimbați se scrie direct pe tambur, între două instrucțiuni, și se ține minte în browserul dumneavoastră; „Revino la original” șterge schimbările.'),
  ('The program on the drum',
   'The words on the drum, written as in the 1962 listings: the address, then the two instructions. You can change any word; the change gets the MODIFIED label.',
   'The notation is that of the period listings, `AAAA  c1 aaaa  c2 aaaa` in octal — CERTAIN: it is the very output of the original 1962 reprinting program (facsimile 4). The mnemonics come from Geier’s table (1961).\n\nThe editor is a tool of the emulator, not of the machine: the 1962 programmers wrote on paper and entered the words from the console or from tape. What you change is written straight onto the drum, between two instructions, and remembered in your browser; “Back to the original” removes the changes.'))
e('atelier-row', 'SIGUR', ['baltacLab', 'geier1961', 'semantica'],
  ('Un cuvânt de pe tambur',
   'Același cuvânt de 31 de biți, citit în două feluri: ca două instrucțiuni (cu mnemonice și în octal) și ca număr (fracție). Mașina nu le deosebea.',
   'Un cuvânt e doar 31 de biți (Lucrarea 7, p. 1 — SIGUR): devine instrucțiune când RAI ajunge la el și număr când o instrucțiune îl citește. De aceea rândul arată ambele citiri. Eticheta din dreapta spune de unde vine cuvântul (ORIGINAL, DEDUS, RECONSTRUCȚIE, GHICIT, MODIFICAT) sau „scris de program”, dacă l-a scris programul cât a rulat. Click pe rând ca să-l schimbați.'),
  ('A word on the drum',
   'The same 31-bit word, read two ways: as two instructions (with mnemonics and in octal) and as a number (a fraction). The machine did not tell them apart.',
   'A word is just 31 bits (lab sheet 7, p. 1 — CERTAIN): it becomes an instruction when RAI reaches it and a number when an instruction reads it. So the row shows both readings. The label on the right says where the word comes from (ORIGINAL, DEDUCED, RECONSTRUCTION, GUESSED, MODIFIED) or “written by the program” if the program wrote it while running. Click the row to change it.'))
e('atelier-drum', 'MIXT', ['wikiRO', 'baltac2011', 'semantica'],
  ('Tamburul: 1024 de cuvinte',
   'Memoria mașinii: un tambur magnetic cu 1024 de cuvinte, care se rotea de 50 de ori pe secundă. Fiecare pătrățel e un cuvânt; culoarea și litera spun de unde vine.',
   'Capacitatea și viteza tamburului sunt SIGURE (Wikipedia RO, Baltac). Grila de 32 × 32 e doar un mod de a desena memoria: adresa = rândul (octal, în stânga) + coloana. Pătratul conturat în portocaliu e adresa curentă (RAI) cât rulează programul. Ulterior, adresele pare și impare au fost puse pe jumătăți diferite ale tamburului (Facsimil 8), ca programele să meargă mai repede.'),
  ('The drum: 1024 words',
   'The machine’s memory: a magnetic drum with 1024 words, turning 50 times a second. Each small square is a word; its colour and letter say where it comes from.',
   'The drum’s capacity and speed are CERTAIN (Romanian Wikipedia, Baltac). The 32 × 32 grid is only a way of drawing the memory: address = row (octal, on the left) + column. The square outlined in orange is the current address (RAI) while the program runs. Later, even and odd addresses were put on different halves of the drum (facsimile 8) so programs would run faster.'))
e('atelier-cell', 'MIXT', ['semantica'],
  ('Un cuvânt pe tambur',
   'Un click duce la rândul lui din editor. Litera: O original, D dedus, R reconstrucție, G ghicit, M modificat de dumneavoastră, P scris de program cât a rulat.',
   'Proveniența urmează regulile din documentație (capitolul 7): un cuvânt schimbat de vizitator — din editor, cu MEMORIE SCRIERE de la pupitru sau de pe propria bandă — devine MODIFICAT; unul scris de program cât rulează apare „scris de program”, pentru că nu mai e cuvântul din document.'),
  ('A word on the drum',
   'A click takes you to its row in the editor. The letter: O original, D deduced, R reconstruction, G guessed, M modified by you, P written by the program while it ran.',
   'Provenance follows the rules in the documentation (chapter 7): a word changed by the visitor — in the editor, with MEMORIE SCRIERE from the console, or from their own tape — becomes MODIFIED; one the program writes while running shows as “written by the program”, because it is no longer the word in the document.'))
e('atelier-punch', 'MIXT', ['farcas2005', 'wikiRO', 'geier1961', 'baltac2011', 'semantica'],
  ('Perforatorul de bandă',
   'Pregătiți o bandă cum se pregăteau programele în 1962: scrieți cuvintele, perforați, puneți banda în cititor și încărcați-o cu preîncărcătorul original INEX-1.',
   '- Perforatorul nu era legat de calculator: benzile se pregăteau separat, la un aparat de tip telex — SIGUR (Farcaș).\n- Gaura = 0, 6 rânduri pe cuvânt, m1–m5 primul — SIGUR / DEDUS (capitolul 5).\n- În modul „rânduri” scrieți valoarea pe care o citește instrucțiunea CIT; desenul arată găurile, adică biții inversați.\n- Preîncărcătorul INEX-1 (Facsimil 5) scrie cuvintele benzii începând de la adresa instrucțiunii ME de la 0014 (0002) și o mărește după fiecare cuvânt. Ca să încărcați în altă parte, schimbați adresa din 0014 în editor — că așa proceda operatorul e GHICIT.\n- Cuvintele scrise de program după ce ați pus banda dumneavoastră în cititor devin MODIFICAT (GHICIT, regula emulatorului).'),
  ('The tape punch',
   'Prepare a tape the way programs were prepared in 1962: write the words, punch, put the tape in the reader and load it with the original INEX-1 preloader.',
   '- The punch was not connected to the computer: tapes were prepared separately, on a telex-type machine — CERTAIN (Farcaș).\n- A hole = 0, 6 rows per word, m1–m5 first — CERTAIN / DEDUCED (chapter 5).\n- In “rows” mode you write the value the CIT instruction reads; the drawing shows the holes, i.e. the bits inverted.\n- The INEX-1 preloader (facsimile 5) writes the tape’s words starting at the address of the ME instruction at 0014 (0002) and advances it after each word. To load elsewhere, change the address at 0014 in the editor — that the operator did so is GUESSED.\n- Words the program writes after you put your own tape in the reader become MODIFIED (GUESSED, the emulator’s rule).'))
e('atelier-controls', 'DEDUS', ['baltacLab', 'semantica'],
  ('Comenzile Atelierului',
   'Pas = INSTRUCTIE UNICA, Rulează = CALCULEAZA AUTOMAT, Oprește = IMPULSURI INTRERUPE, ca pe pupitru. Reset golește registrele și lasă tamburul neatins.',
   'Comenzile trimit aceleași acțiuni ca butoanele pupitrului (Lucrarea 7, p. 6; efectele sunt DEDUSE din inscripții). Reset nu are un buton corespunzător pe pupitru: e o comoditate a emulatorului, echivalentă cu ANULEAZA S, M și RAI apăsate împreună. Adresa de pornire e legată de comutatoarele RAI.'),
  ('Workshop controls',
   'Step = INSTRUCTIE UNICA, Run = CALCULEAZA AUTOMAT, Stop = IMPULSURI INTRERUPE, as on the console. Reset clears the registers and leaves the drum untouched.',
   'The controls send the same actions as the console buttons (lab sheet 7, p. 6; the effects are DEDUCED from the inscriptions). Reset has no matching button on the console: it is a convenience of the emulator, equivalent to pressing ANULEAZA S, M and RAI together. The start address is tied to the RAI switches.'))
e('prov-modificat', 'SIGUR', ['semantica'],
  ('MODIFICAT',
   'Cuvântul a fost schimbat sau scris de dumneavoastră. Nu mai e cuvântul din documentul de epocă, așa că nu mai poartă eticheta ORIGINAL.',
   'Eticheta e a emulatorului și e o promisiune: niciun cuvânt schimbat de vizitator nu rămâne ORIGINAL — nici în editor, nici pe tambur, nici în eticheta programului, nici în fișierul .mec descărcat. Un fișier deschis e comparat cu programul din catalog; ce diferă devine MODIFICAT, orice ar scrie în fișier.'),
  ('MODIFIED',
   'You changed or wrote this word. It is no longer the word in the period document, so it no longer carries the ORIGINAL label.',
   'The label belongs to the emulator and is a promise: no word changed by the visitor stays ORIGINAL — not in the editor, not on the drum, not in the program label, not in the downloaded .mec file. An opened file is compared with the catalogue program; whatever differs becomes MODIFIED, whatever the file says.'))

# ---------------- sunetul ----------------
e('sound', 'GHICIT', ['semantica'],
  ('Sunetul',
   'Zumzetul tamburului, țăcănitul cititorului, clapele mașinii de scris și clicurile comenzilor. Sunt reconstruite: nu există înregistrări ale MECIPT-1.',
   'Sunetele sunt sintetizate în browser și urmează exact ce face mașina emulată: un clic pentru fiecare rând de bandă citit și o lovitură de clapă pentru fiecare caracter tipărit, cam unul la 0,1 s; la rând nou se aude carul.\n\n- **Zumzetul** are 50 Hz pentru că tamburul face 50 de rotații pe secundă (DEDUS din 1024 de cuvinte și 51 200 de timpi de cuvânt pe secundă). Timbrul lui e GHICIT.\n- **La viteză mare** clicurile vin prea des ca să se audă separat și devin un bâzâit continuu, mai încet.\n- **Comenzile** pupitrului fac clicuri discrete; bara de sus și Atelierul nu fac sunet, pentru că sunt comenzi de azi.\n\nAlegerea 🔊/🔇 se ține minte. Browserele pornesc sunetul abia după primul gest (clic, atingere sau tastă), așa că pe telefon îl veți auzi după prima atingere.'),
  ('Sound',
   'The hum of the drum, the clatter of the tape reader, the typewriter keys and the clicks of the controls. They are reconstructed: no recordings of MECIPT-1 exist.',
   'The sounds are synthesised in the browser and follow exactly what the emulated machine does: one click for each tape row read and one key strike for each character typed, roughly one every 0.1 s; a new line sounds the carriage.\n\n- **The hum** is at 50 Hz because the drum turns 50 times a second (DEDUCED from 1024 words and 51,200 word times a second). Its timbre is GUESSED.\n- **At high speed** the clicks come too often to be heard separately and turn into a continuous, quieter buzz.\n- **The console controls** make discreet clicks; the top bar and the Workshop make no sound, because they are present-day controls.\n\nThe 🔊/🔇 choice is remembered. Browsers only start sound after the first gesture (a click, a touch or a key), so on a phone you will hear it after the first touch.'))

# ---------------- turul ghidat ----------------
# (id, target, view, waitFor, load, ro, en)
TOUR = [
 ('welcome', 'desk', 'all', None, None,
  'Acesta e pupitrul de comandă al calculatorului MECIPT-1, construit la Institutul Politehnic din Timișoara și pus în funcțiune în 1961 — primul calculator electronic făcut într-o universitate din România. Avea circa 2000 de tuburi electronice. Turul vă arată, în câțiva pași, cum se lucra la el.',
  'This is the control console of MECIPT-1, built at the Polytechnic Institute of Timișoara and put into service in 1961 — the first electronic computer made at a university in Romania. It had about 2000 electron tubes. In a few steps, this tour shows how it was operated.'),
 ('middle-panel', 'meter-0', 'middle', None, None,
  'Panoul din mijloc are unsprezece aparate de măsură, cele mai multe voltmetre pentru tensiunile de alimentare ale tuburilor. Pe fotografiile păstrate scalele nu se pot citi, așa că ce măsura fiecare aparat e ghicit. Unul lipsește azi; aici e redesenat după vecinii lui.',
  'The middle panel has eleven measuring instruments, most of them voltmeters for the tubes’ supply voltages. The scales cannot be read on the surviving photographs, so what each instrument measured is guessed. One is missing today; here it is redrawn after its neighbours.'),
 ('memory-drum', 'lamp-M-0', 'right', None, None,
  'Memoria era un tambur magnetic care se rotea de 50 de ori pe secundă și ținea 1024 de cuvinte. Rândul de sus, M, arată un cuvânt de 31 de biți: bec aprins = 1. Becul 0 e semnul.',
  'The memory was a magnetic drum turning 50 times a second and holding 1024 words. The top row, M, shows a 31-bit word: lamp lit = 1. Lamp 0 is the sign.'),
 ('words', 'lamp-RI-0', 'right', None, None,
  'Un cuvânt ține un număr sau două instrucțiuni. Fiecare instrucțiune are un cod de operație (5 biți) și o adresă (10 biți). Rândul RI arată instrucțiunea care se execută acum.',
  'A word holds a number or two instructions. Each instruction has an operation code (5 bits) and an address (10 bits). The RI row shows the instruction being executed now.'),
 ('rai', 'switch-RAI-0', 'right', None, None,
  'RAI ține adresa următorului cuvânt cu instrucțiuni. Cu comutatoarele de sub el, operatorul dădea adresa de la care pornește programul. Aici e ghicit cum lucrau pârghiile: sus = 1, iar fiecare mutare pune toată adresa în RAI. Butoanele ANULEAZA sugerează că poate registrul se golea întâi și pârghiile doar adăugau biți.',
  'RAI holds the address of the next instruction word. With the switches below it, the operator gave the address where the program starts. How the levers worked is guessed here: up = 1, and each move puts the whole address into RAI. The ANULEAZA (clear) buttons suggest that the register may have been cleared first, with the levers only adding bits.'),
 ('start-address', 'switch-RAI-0', 'right', None, 'retiparire-1962',
  'Am încărcat programul original din 6 septembrie 1962 care își retipărește propriul listing. Comutatoarele RAI arată deja adresa lui de pornire: 1477 în octal.',
  'We have loaded the original program of 6 September 1962 that reprints its own listing. The RAI switches already show its start address: 1477 in octal.'),
 ('run', 'switch-compute-0', 'right', 'typed', None,
  'Acum rulăm programul: apăsați butonul CALCULEAZA AUTOMAT, marcat cu galben. Turul continuă când mașina începe să scrie.',
  'Now let us run the program: press the CALCULEAZA AUTOMAT (compute: automatic) button, marked in yellow. The tour continues when the machine starts typing.'),
 ('typewriter', 'sheet', 'all', None, None,
  'Mașina de scris tipărește listingul, caracter cu caracter, la viteza din 1962: cam 50 de instrucțiuni pe secundă, pentru că mașina aștepta tamburul să se rotească. Cu „rapid” se poate grăbi de 100 de ori.',
  'The typewriter prints the listing, character by character, at 1962 speed: about 50 instructions a second, because the machine waited for the drum to turn. “Fast” speeds it up 100 times.'),
 ('microops', 'lamp-uop-0', 'left', None, None,
  'Fiecare instrucțiune era făcută din pași mărunți, microoperații. Pe panoul stâng, fiecare are un bec cu numele ei; becurile clipesc pe măsură ce mașina lucrează.',
  'Each instruction was made of small steps, micro-operations. On the left panel each one has a lamp with its name; the lamps flicker as the machine works.'),
 ('r2', 'lamp-R2-0', 'left', None, None,
  'R II arată microoperația de dinaintea celei din R I, de pe panoul drept: la fiecare pas, conținutul lui R I trece în R II. Așa putea operatorul urmări microprogramul pas cu pas. Numărul pe care îl arată emulatorul aici e ghicit.',
  'R II shows the micro-operation before the one in R I, on the right panel: at every step, the content of R I moves into R II. This let the operator follow the microprogram step by step. The number the emulator shows here is guessed.'),
 ('generator', 'knob', 'left', None, None,
  'Generatorul principal dădea ritmul impulsurilor care mișcau mașina: după inscripții, frecvența se regla fin sau în trepte și se putea folosi un generator extern. Ce făcea exact fiecare comutator nu se știe; în emulator nu fac nimic.',
  'The main generator set the rhythm of the pulses that drove the machine: going by the inscriptions, the frequency was set finely or in steps, and an external generator could be used. What each switch did exactly is unknown; in the emulator they do nothing.'),
 ('tape', 'tape', 'all', None, None,
  'Programele intrau pe bandă perforată de telex: 5 canale, gaura înseamnă 0, un cuvânt ocupă 6 rânduri. Alegeți programul INEX-1 ca să vedeți banda trecând prin cititor.',
  'Programs came in on punched telex tape: 5 channels, a hole means 0, one word takes 6 rows. Choose the INEX-1 program to see the tape run through the reader.'),
 ('provenance', 'provenance', 'all', None, None,
  'Această etichetă spune de unde vine programul: ORIGINAL înseamnă transcris din documente de epocă; RECONSTRUCȚIE și GHICIT marchează ce am completat noi.',
  'This label says where the program comes from: ORIGINAL means transcribed from period documents; RECONSTRUCTION and GUESSED mark what we have filled in.'),
 ('more', 'doc-link', 'all', None, None,
  'Pentru orice element, apăsați „Explică” și apoi elementul. Documentația conține tot: instrucțiunile, banda, pupitrul, ce e sigur și ce e ghicit, și sursele.',
  'For any element, press “Explain” and then the element. The documentation has everything: the instructions, the tape, the console, what is certain and what is guessed, and the sources.'),
]

# grupul de pe pupitru încadrat la fiecare pas (toate becurile și comutatoarele lui)
TOUR_GROUPS = {'middle-panel': 'meters', 'r2': 'R2', 'generator': 'generator', 'memory-drum': 'M', 'words': 'RI', 'rai': 'RAI', 'start-address': 'RAI', 'run': 'compute', 'microops': 'uop'}

UOPS_EN = ['s goes into M [?]', 's goes into I', 'i goes into S', 'Logical multiplication (AND)',
 'Shift: left in S · I. goes into S.', 'Shift: right in S · zero goes into S.', 'Shift: left in I · zero goes into I.',
 'Shift: right in I · S. goes into I.', 'Change M.', 'If M. = 1 change M into M̄', 'Change M into M̄ except M. [?]',
 'If S. = 1 change S into S̄', 'If α = 1 change S into S̄', 'If β = 1 change S into S̄', 'Move RAI (advance it)',
 '2(ra) goes into RAI', '(ra)/2 goes into RA', 'Set the counter to 2 and N = 0 [?]', 'Move the counter',
 '(ra) goes into counter N', 'Instruction 2 goes into place 1', 'ra goes into RI', 'S. goes into α',
 'If S. = M., β = 0 · if S. ≠ M., β = 1', 'If s = 0 and i = 0 set β = 0 [?]', 'If i = 0 set β = 0 [?]',
 'If s = 0 set α = 0', 'If s = 0 and i = 0 set S. = 1 [?]', 'If s = 0 set I. = 1', 'S̄. goes into I.',
 'β goes into I.', 'S. goes into S.', 'If β = 0 and S. ≠ α [?], DCR', 'If I. = 1 [?], DCR', 'If S. ≠ S. [?], DCR',
 'Zero goes into M.', 'One goes into M.', 'Zero goes into γ', 'One goes into γ']
OPS_EN = ['Halt; on restart continue from y', 'S ← y', 'S ← –y', 'S ← |y|', 'S ← –|y|', 'S ← s + y', 'S ← s – y',
 'S ← s + |y|', 'S ← s – |y|', 'S & I ← s × y', 'S ← s × y, rounded', 'I ← s : y, S ← remainder', 'Y ← s + y',
 'jump (transfer) to y', 'jump to y if s ≥ 0 (per the table)', 'jump to y if s < 0 (per the table)', 'jump to y if s ≠ 0',
 'logical shift left of S & I by “n” places', 'logical shift right of S & I by “n” places', 'logical shift left of S by “n” places',
 'logical shift right of S by “n” places', 'store s at y', 'store i at y', 'I ← y', 'next instruction (no operation)',
 'S ← s ∙ y (logical product)', 'peripheral command (sub-code in the address field)',
 'read one tape character and store it right-aligned at y', 'transfer y to the ICR automaton']
assert len(UOPS_EN) == 39 and len(OPS_EN) == 29
OPS_REAL_EN = {'14': 'jump to y if s < 0 (deduced from the original programs; Geier’s table says s ≥ 0)',
               '15': 'jump to y if s ≥ 0 (deduced from the original programs; Geier’s table says s < 0)'}

def build(lang):
    k = 0 if lang == 'ro' else 1
    out = {'entries': {}, 'sources': {s: v[k] for s, v in SOURCES.items()}, 'tour': []}
    for sid, target, view, wait, load, ro, en in TOUR:
        st = {'id': sid, 'target': target, 'view': view, 'waitFor': wait, 'text': ro if lang == 'ro' else en}
        if load:
            st['load'] = load
        if sid in TOUR_GROUPS:
            st['group'] = TOUR_GROUPS[sid]
        out['tour'].append(st)
    for key, st, src, ro, en in E:
        t = ro if lang == 'ro' else en
        out['entries'][key] = {'title': t[0], 'short': t[1], 'more': t[2], 'status': st, 'sources': src}
    if lang == 'en':
        out['uops'] = {str(i): u for i, u in enumerate(UOPS_EN)}
        out['ops'] = {str(i): o for i, o in enumerate(OPS_EN)}
        out['ops_real'] = OPS_REAL_EN
    else:
        out['uops'] = {}
        out['ops'] = {}
    return out

import sys
for lang in ('ro', 'en'):
    with open(f'{sys.argv[1]}/{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(build(lang), f, ensure_ascii=False, indent=1)
        f.write('\n')
print(len(E), 'entries')
