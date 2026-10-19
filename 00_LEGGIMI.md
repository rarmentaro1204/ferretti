# Pacchetto di passaggio — Configuratore offerte (da Depureco a settore YACHT)

Questo pacchetto serve a rifare, su un altro account Claude, lo stesso lavoro fatto per Depureco (aspiratori industriali) ma per il **settore yacht**.

## Contenuto
| File | A cosa serve |
|---|---|
| `00_LEGGIMI.md` | Questa pagina |
| `01_HANDOFF_PROGETTO.md` | Tutto quello che è stato costruito, come funziona, scelte fatte, trappole incontrate |
| `02_PROMPT_INIZIALE.md` | Il primo messaggio da incollare nella nuova sessione di Claude |
| `03_CLAUDE.md` | Istruzioni di progetto: salvare come `CLAUDE.md` nella cartella di lavoro |
| `04_CHECKLIST_ADATTAMENTO_YACHT.md` | File per file: cosa cambiare per il settore yacht |
| `configuratore-offerte-codice.zip` | Codice sorgente completo del configuratore (modulare, senza dati/immagini/Excel Depureco) |

## Come usarlo (3 passi)
1. Nel nuovo account apri **Claude Code** (o Cowork) in una cartella vuota, es. `~/Desktop/Yacht`.
2. Decomprimi `configuratore-offerte-codice.zip` in quella cartella e copia `03_CLAUDE.md` come `CLAUDE.md`. Metti gli altri `.md` in una sottocartella `passaggio/`.
3. Incolla il contenuto di `02_PROMPT_INIZIALE.md` come primo messaggio. Claude leggerà `passaggio/` e ti farà le domande che servono (azienda, catalogo, brand).

## Prima di caricare
- Il pacchetto **non contiene** token, password, prezzi o dati dei clienti. Il token GitHub non è mai nel codice.
- Il codice contiene ancora segnaposto Depureco (logo, anagrafica, colori): vanno sostituiti (vedi checklist).
- Non condividere con altri il file `dist/index.html` o la repo se contengono listini riservati.
