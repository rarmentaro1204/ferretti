# Checklist di adattamento — da aspiratori industriali a yacht

Legenda: 🔴 va cambiato · 🟡 verificare · 🟢 riutilizzabile così com'è

## A. Domande da fare all'utente (prima di toccare il codice)
1. Chi è il cliente: cantiere, broker, distributore, charter? Che cosa si offre (nuove imbarcazioni, usato, allestimenti, refit, servizi)?
2. Marca: manuale esistente? Colori, font, logo (SVG), indirizzo, P.IVA, sito.
3. Catalogo: sito (JSON-LD?), Excel, PDF? Quante imbarcazioni/modelli? Immagini disponibili?
4. Come si "configura" un'offerta: modello base + optional/allestimenti (matrice optional) + extra (trasporto, varo, garanzia)?
5. Valuta (€/$/£), IVA, lingue necessarie, condizioni generali di vendita (testo ufficiale), acconti/pagamenti a rate.
6. Commerciali (solo nome o anche mail/telefono) e chi può fare offerte.
7. Dove pubblicare (Netlify), repo GitHub dati privata, chi collega con token.

## B. Mappa file → azione
| File | Azione | Note yacht |
|---|---|---|
| `js/config/brand.js` | 🔴 | BRAND (nome, ragione sociale, prefisso offerta es. `YC-`, indirizzo, web, P.IVA), logo SVG chiaro/scuro, simbolo copertina, footer |
| `css/brand.css` | 🔴 | colori e font del marchio (es. blu navy / oro / bianco: **solo se coerenti col brand reale**) |
| `js/data/i18n.js` | 🟡 | tradurre/adattare voci: "Macchina→Imbarcazione", "aspiratore"→"yacht", etichette specifiche, testi di default (consegna "Ex Works…"→es. "Consegna in cantiere/porto", pagamento a rate) |
| `js/app/core.js` | 🔴 | `SPEC_FIELDS` e `SPEC_UNITS`: oggi power/voltage/vacuum/airflow…; per yacht: lunghezza fuori tutto (m), baglio (m), pescaggio (m), dislocamento (t), motori (potenza kW/hp), velocità max/crociera (kn), cabine, posti letto, serbatoi carburante/acqua (l), categoria CE (A/B/C/D), materiale scafo. Aggiornare anche `spec_*` in i18n e il caricatore Excel |
| `js/app/xlsx-loader.js` | 🔴 | mappa colonne Excel → campi (`get('Lunghezza',…)`) |
| `js/app/step-product.js` | 🟡 | categorie/filtri: al posto di Protezione ATEX/ACD → es. Tipo (motor yacht, sailing, catamarano…), Lunghezza (fascia), Nuovo/Usato |
| `js/app/steps-customer-application.js` | 🔴 | passo "Applicazione" → "Uso/Programma di navigazione" (charter/privato, area, equipaggio, bandiera, consegna…) |
| `js/app/quote.js` | 🟡 | documento A4: scheda imbarcazione (galleria foto, piani generali), pagina optional/allestimenti, condizioni (acconti), marcatura CE al posto di ATEX; rimuovere `atexMarking`/`kitIncludedFor` |
| `js/app/step-options.js` | 🟡 | optional/allestimenti: la matrice optional per modello è il cuore dell'offerta yacht (pacchetti, gruppi: Coperta, Interni, Elettronica, Motori…) — adattare `OPT_GROUP_ORDER` |
| `js/app/dashboard.js` | 🟡 | etichette (macchine→imbarcazioni); il resto è riutilizzabile. Valori alti → formato "€ 1,2 M" |
| `js/app/persistence.js`, `github.js`, `recall.js`, `router.js`, `init.js`, `folder-pdf.js` | 🟢 | cambiare solo nomi file/chiavi `depureco_*` → `yacht_*` (localStorage, `__depurecoOffer`, nome DB IndexedDB) |
| `js/data/general-terms.js` | 🔴 | testo legale ufficiale del cliente (non inventare) |
| `js/data/defaults.js` | 🔴 | commerciali, eventuali optional/ricambi di avvio |
| `scraper/scrape_*.py`, `categorie.py` | 🔴 | nuovo scraper per il catalogo yacht (stesso schema colonne); nuove regole categoria |
| `tools/*.py` | 🟡 | `build_catalog_js`, `build_price_matrix`, `build_excel_templates`: adattare nomi colonne/specifiche; `build_single_html` invariato |
| `netlify.toml`, `README.md` | 🟡 | descrizione nuova; mantenere `noindex` |
| `brand/BRAND_GUIDELINES.md` | 🔴 | rifare per il nuovo marchio |

## C. Ordine di lavoro consigliato
1. Domande + brand → `brand.js`/`brand.css` → verifica visiva (copertina, lettera, scheda).
2. Catalogo: scraper o import Excel → `catalogo.js` + immagini → verifica elenco prodotti e filtri.
3. Specifiche e testi (`SPEC_FIELDS`, i18n) → documento A4 per l'imbarcazione.
4. Matrice optional + matrice prezzi (Excel con sola colonna prezzo) → verifica calcolo e sconti.
5. GitHub privata + token → salvataggio, elenco, richiamo → verifica con finta API o repo di prova.
6. Dashboard + demo multilingua → rigenerare dati demo con nomi/modelli yacht.
7. `build_single_html.py` → Netlify (`dist`). Presentazione commerciale (stessa struttura a 11 slide).

## D. Verifiche finali
- Console senza errori; richiamo di un'offerta in ognuna delle lingue; PDF corretto (logo, foto, totali).
- Nessun prezzo, cliente o token nei file committati (`git grep -i "github_pat_"`).
- Repo dati privata; l'app rifiuta repo pubbliche.
- README aggiornato; elenco di ciò che manca (prezzi, testi legali, immagini).
