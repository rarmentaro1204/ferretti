# Istruzioni di progetto — Configuratore offerte (yacht)

## Lingua e stile
- Rispondi in **italiano**. Codice: nomi tecnici in inglese, commenti brevi.
- Sii conciso: dì cosa hai fatto, cosa hai verificato, cosa resta.

## Regole di lavoro
- **Adatta** il configuratore esistente (HTML modulare: `index.html`, `css/`, `js/`, `tools/`, `scraper/`); non riscrivere.
- Dopo ogni modifica: verifica nel browser (apri `index.html` con un server statico) e controlla la console. Per i JS separati forza il reload (cache).
- Ricostruisci il file unico con `python3 tools/build_single_html.py` prima di ogni commit.
- Un commit per tappa, messaggio in italiano. **Il `git push` lo esegue l'utente.**
- Non inventare prezzi, specifiche, commerciali, testi legali: usa segnaposto evidenti e segnalali.

## Sicurezza (non negoziabile)
- Mai token/password nel codice o in chat. Il token GitHub resta nel localStorage del browser.
- Dati clienti/offerte solo in una repo **privata** separata; l'app deve rifiutare repo pubbliche.
- Nessun prezzo/sconto/cliente dentro il file HTML pubblicato (si caricano a runtime da Excel).
- File con listini di terzi: `.gitignore`, mai in repo pubbliche.

## Convenzioni dati (invarianti)
- Listino unico: colonna `Prezzo`. Catalogo: foglio `Macchine`, intestazione fra le prime 15 righe contenente `Codice`.
- Numero offerta `PREFISSO-AA-NNN`, revisioni `_REVn`. Righe demo: `demo:true`, mai persistite fuori dal browser.
- Esiti: `open|won|lost`; scadenza = data + `validity` giorni; lingua salvata con l'offerta (`lang`).
- Sconti: generale a cascata (3 step) + extra di riga a cascata ("5+3").

## Brand
- Tutti i colori/font in `css/brand.css`; anagrafica, logo e footer in `js/config/brand.js`. Prima di costruire chiedi se esiste un manuale di marca; se no, ricostruiscilo dal sito e scrivi `brand/BRAND_GUIDELINES.md` dichiarando che è ricostruito.
