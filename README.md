# Configuratore offerte yacht — Ferretti Yachts

Configuratore HTML (nessun backend) a 5 passi: Cliente → Programma di navigazione → Prodotto → Opzioni → Offerta (PDF A4), con registro offerte, richiamo, dashboard e salvataggio su GitHub privata.
Derivato dal configuratore Depureco; la guida di passaggio è in `00_LEGGIMI.md` … `04_CHECKLIST_ADATTAMENTO_YACHT.md`.

## Stato
- **Catalogo**: 11 modelli (9 Flybridge + 2 Infynito) estratti da www.ferretti-yachts.com con `scraper/scrape_ferretti.py` → `excel/catalogo_ferretti.xlsx` + `images/`. Dati da verificare con il listino ufficiale.
- **Prezzi**: listino barche 2026-2027 (IVA esclusa) e listino optional del **solo 720** (124 voci, tradotte in italiano). Sono riservati («strictly private and confidential»): stanno in `data-private/` (in `.gitignore`), generati con `tools/build_prezzi_ferretti.py <optional 720>.pdf`. In locale si caricano da soli; sul sito pubblicato non ci sono: usare **Carica listino** e **Carica matrice optional**. Per gli altri modelli c'è solo il delta della motorizzazione optional + righe libere per gruppo (Motorizzazione, Coperta, Interni, Elettronica, Comfort, Servizi, Altro).
- **Presentazione modelli nel PDF**: una pagina A4 per modello, con foto dalle brochure (scaricate da starshipyachts.com in `brochures/`, estratte con `tools/extract_brochure_images.py` in `images/brochure/`), testi del sito Ferretti e dati tecnici.
- **Lingue**: italiano e inglese. **Valuta**: EUR.
- **Brand**: ricostruito dal sito (`brand/BRAND_GUIDELINES.md`); logo = wordmark provvisorio.
- **Segnaposto da completare**: anagrafica emittente (`js/config/brand.js`), commerciali (`js/data/defaults.js`), condizioni generali (`js/data/general-terms.js`).

## Comandi
```
python3 scraper/scrape_ferretti.py            # rigenera excel/catalogo_ferretti.xlsx e images/
python3 tools/build_catalog_js.py excel/catalogo_ferretti.xlsx   # -> js/data/catalogo.js
python3 tools/build_single_html.py            # -> dist/index.html (file unico, pubblicato da Netlify)
python3 -m http.server 8781                   # sviluppo: http://localhost:8781/index.html
```
Prezzi: caricare un Excel con colonne `Codice` + `Prezzo` ("Carica listino"): i dati tecnici restano quelli del catalogo.

## Da fare / non adattato
- `tools/build_excel_templates.py`, `build_price_matrix.py`, `report_categorie.py` e `scraper/categorie.py` sono ancora quelli Depureco.
- `dist/index.html` contiene le immagini del sito Ferretti incorporate: verificare i diritti d'uso prima di pubblicare.
- Sicurezza: token GitHub solo nel browser, repo dati sempre privata, nessun prezzo nel file pubblicato.
