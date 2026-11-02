# Configuratore offerte yacht — Azimut Yachts

Stesso configuratore HTML (nessun backend) di Ferretti — 4 passi: Cliente → Prodotto → Opzioni → Offerta (PDF A4), con registro offerte, richiamo, dashboard e salvataggio su GitHub privata — **rimarchiato Azimut** secondo il kit brand ufficiale (`brand/BRAND_GUIDELINES.md`).

## Stato
- **Catalogo**: 28 modelli di tutta la flotta (Seadeck 6/7/9, Fly 53–82, S 6/7/8, Magellano 60/66/25m/27m/30m, Verve 42/48, Atlantis 45/51, Grande 26m–44m e Trideck) estratti da azimutyachts.com con `scraper/scrape_azimut.py` → `excel/catalogo_azimut.xlsx` + `images/` (6 foto per modello, esterni per primi). Testi IT/EN, LOA, baglio, immersione, dislocamento, cabine/posti letto, motori standard/optional, velocità, serbatoi, materiale, certificazioni, designer, link alla scheda ufficiale. **Dati da verificare con il listino/specifiche ufficiali.**
- **Prezzi**: a 0 (nessun listino Azimut disponibile). Si caricano a runtime con **Carica listino** (Excel con `Codice` + `Prezzo`) e **Carica matrice optional**, oppure da `data-private/` in locale (`01_Listino_Prezzi_Azimut.xlsx`, `02_Matrice_Optional_Azimut.xlsx`, in `.gitignore`). Nessun prezzo nel sito pubblicato.
- **Optional precaricati**: solo la motorizzazione alternativa indicata dal sito (prezzo 0).
- **Lingue**: italiano e inglese. **Listino**: unico, in euro (la scelta € | $ è stata eliminata; il codice di conversione resta inutilizzato in `js/app/step-product.js`).
- **Brand**: ufficiale (palette, Helvetica Neue/Arial, wordmark). Un solo accento rosso per pagina, nessuno sfondo scuro.
- **Segnaposto**: anagrafica emittente (`js/config/brand.js`), commerciali (`js/data/defaults.js`), condizioni generali (`js/data/general-terms.js`).

## Comandi (da `azimut/`)
```
python3 scraper/scrape_azimut.py                       # rigenera excel/catalogo_azimut.xlsx e images/ (richiede Pillow)
python3 tools/build_catalog_js.py excel/catalogo_azimut.xlsx   # -> js/data/catalogo.js
python3 tools/build_single_html.py                     # -> dist/index.html + dist/images (pubblicati da Netlify)
python3 -m http.server 8766                            # sviluppo: http://localhost:8766/index.html
```
Netlify: nuovo sito dalla stessa repo con *Base directory* `azimut`, *Publish directory* `dist`. Funzione ponte GitHub: variabili `GITHUB_TOKEN`, `GH_OWNER`, `GH_REPO` (default `azimut-offerte`, repo privata separata).

## Note
- Lo scraper rispetta robots.txt, fa pausa tra le richieste, nessun login. Le foto appartengono ad Azimut: verificare i diritti d'uso prima di pubblicare.
- Il filtro foto scarta VR/schede tecniche/layout; qualche piano di coperta può restare tra le foto secondarie.
- Chiavi localStorage con prefisso `azimut_` (non interferiscono con Ferretti).
