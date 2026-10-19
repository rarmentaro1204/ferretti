# Handoff — Configuratore offerte (progetto Depureco)

## 1. Obiettivo e contesto
Un'azienda commerciale faceva le offerte con copia-incolla di mail/Word. Abbiamo costruito un **configuratore di offerte in HTML puro** (nessun backend): sceglie i prodotti da un catalogo, calcola sconti, genera un **PDF A4 con marchio**, salva le offerte su **GitHub (repo privata)**, e ha una **dashboard** per commerciale (offerte per mese/anno, vinte/perse, statistiche macchine, scadenze).
Origine: ricostruzione modulare di un generatore offerte monofile preesistente (non incluso: riservato). Lingua di lavoro dell'utente: **italiano**. Nel file e nelle risposte: italiano; nel codice: commenti in inglese/italiano misti, nomi tecnici in inglese.

## 2. Architettura (statica, senza server)
```
index.html                  sviluppo: carica css/ e js/ nell'ordine giusto (script classici, scope globale condiviso)
dist/index.html             file UNICO con tutto incorporato (CSS, JS, catalogo, immagini in base64) → è ciò che pubblica Netlify
netlify.toml                publish="dist", nessun build, header noindex
css/brand.css               design token (colori, font) ← qui vive il brand
css/app.css                 layout/componenti
js/config/brand.js          anagrafica, logo (SVG), footer del documento, prefisso numero offerta
js/data/i18n.js             traduzioni (it,en,es,fr,de)  ·  general-terms.js: condizioni di vendita (segnaposto)
js/data/catalogo.js         catalogo macchine (GENERATO dall'Excel con tools/build_catalog_js.py)
js/data/defaults.js         commerciali, optional, ricambi di avvio
js/app/*.js                 core (stato, helper) · steps-customer-application · step-product · step-options
                            quote (calcolo totali + documento A4) · router · persistence (registro, richiamo, salvataggio)
                            folder-pdf (cartella collegata + PDF) · xlsx-loader · dashboard · github · recall · init
tools/                      build_catalog_js · build_price_matrix · build_excel_templates · build_single_html · report_categorie
scraper/                    scrape_<sito>.py · categorie.py (regole di categorizzazione) · confronto con concorrente
images/                     <CODICE>.png, una per modello (scaricate dallo scraper)
excel/                      file da compilare/caricare (generati da tools/build_excel_templates.py)
```
Le dipendenze esterne a runtime: SheetJS (xlsx 0.18.5), html2canvas e jsPDF (caricati al bisogno), Google Fonts. Tutto da CDN.

## 3. Flusso utente (5 passi + extra)
Cliente → Applicazione → Prodotto → Opzioni → Offerta (anteprima A4 modificabile a video; "Salva offerta" = PDF + registro + GitHub).
Extra: **📚 Offerte** (elenco + richiamo), **📊 Dashboard**, **GitHub** (collegamento), pulsanti "Carica listino / matrice optional / immagini / clienti / registro", "Collega cartella" (File System Access API, solo Chrome/Edge).

## 4. Dati e formati (da tenere identici nel nuovo progetto)
**Catalogo (Excel, foglio `Macchine`, intestazione riga 4)**: Codice, Famiglia, Categoria, Sottocategoria, Protezione, Nome, ATEX, Prezzo, specifiche tecniche..., Descrizione, URL, Immagine_URL, Immagine_File. Il loader cerca la riga di intestazione fra le prime 15 che contiene "codice". **Listino unico**: colonna `Prezzo` (non L0/LE).
**Fusione prezzi**: caricando un Excel col solo `Codice`+`Prezzo`, i dati tecnici restano quelli del catalogo incorporato (merge per codice).
**Matrice optional**: foglio `Optional_Prezzi`: riga "Gruppo", riga "Codice Macchina" (= codici optional), riga "Descrizione", poi una riga per macchina; cella vuota = optional non disponibile. Fogli facoltativi `Catalogo_Optional`, `Da_Verificare`.
**Registro offerte (Excel)**: foglio `Offerte` (Progressivo, Numero_Offerta, Data, Cliente, Referente, Totale_EUR, Macchina_Offerta, Optional_Aggiunti, Note, Stato, Data_Esito, Valore_Vinto, Validita_Giorni) + foglio `Righe` (una riga per macchina offerta: Numero_Offerta, Pacchetto, Codice, Nome, Categoria, Qta, Valore_EUR, Venduta).
**Offerta su GitHub**: `offerte/<anno>/<NUMERO>.json` = `{version, savedAt, row, snapshot}` e `<NUMERO>.pdf`. `snapshot` = `{__depurecoOffer:true, baseOfferNum, savedAt, lang, state}` dove `state` è l'oggetto `S` completo (richiamabile).
**Riga offerta (row)**: `{prog,num,date,client,rep,lang,total,machine,addedOptionals,note,validity,status('open'|'won'|'lost'),outcomeDate,wonValue,lines[{code,name,category,qty,value,pkg,won}],demo?}`.

## 5. Funzioni principali e regole di business
- **Sconti**: generale a cascata fino a 3 step (es. 40+5+3) + **sconto extra di riga che si somma in cascata** al generale, anche a più step (`"5+3"`). Formula: `prezzo × Π(1−x/100)`.
- **Alternative vs ordine unico**: le macchine sono alternative per default (il cliente ne sceglie una); con "stesso ordine" si sommano. Il totale registrato = prima soluzione.
- **Numerazione**: `PREFISSO-AA-NNN` progressiva e globale (con GitHub si "riserva" creando il file; 422 → numero successivo). Richiamo = nuova revisione `_REVn`.
- **Dashboard**: per commerciale e anno: KPI, tabella mese per mese + totale anno, vinte vs offerte (numero e valore), macchine offerte/vendute (per modello e categoria), elenco con esito (Aperta/Vinta/Persa, macchine vendute spuntabili, valore vinto modificabile), **scadenze** (countdown live, scadute prima, poi per data; scadenza = data + validità giorni).
- **Offerte demo**: 32 offerte fittizie (20 it + 3 per en/es/fr/de) generate con PRNG deterministico, solo in localStorage, `demo:true` → mai su Excel/GitHub/numerazione; si nascondono quando ci sono offerte vere.
- **Lingue**: la lingua è salvata con l'offerta e ripristinata al richiamo.

## 6. Sicurezza e privacy (decisioni importanti)
- Il token GitHub (fine-grained, solo repo privata, Contents RW, con scadenza) sta **solo nel localStorage** del browser, mai nel codice.
- Il configuratore **rifiuta di scrivere se la repo è pubblica** (controllo `private===true`).
- Dati clienti/offerte → repo **privata separata** (`dprc-offerte`), mai nella repo pubblica del codice.
- Chi apre il sito Netlify può copiare l'HTML (impossibile impedirlo): quindi **nessun prezzo/sconto/cliente dentro il file pubblicato**; prezzi caricati a runtime da Excel locale; sito con `noindex`; password Netlify solo su piano a pagamento.
- File con prezzi interni di terzi (listini di altre aziende) **non** vanno mai in repo pubbliche: metterli in `.gitignore`.

## 7. Come abbiamo ottenuto il catalogo (scraping)
Sito WordPress con Yoast: `prodotto-sitemap.xml` + **JSON-LD schema.org** (`Product` con `model[]` e `additionalProperty`) → una riga per modello. Solo libreria standard Python + openpyxl, pausa tra richieste, rispetto robots.txt, nessun login. Immagini: URL dal JSON-LD (CDN Jetpack, parametro `fit=` per ridimensionare), salvate `<CODICE>.png`, riusate per modelli della stessa famiglia.
**Categorizzazione**: le categorie del sito si sovrappongono → regole in `scraper/categorie.py` (una categoria per *tipo di macchina* + attributo `Protezione` separato come filtro) + report di revisione (`tools/report_categorie.py`); famiglie senza regola → "DA VERIFICARE".
Per un nuovo settore: se il sito non ha JSON-LD, cambiare l'estrazione (HTML, API, PDF/catalogo) ma **mantenere lo stesso schema colonne**.

## 8. Trappole incontrate (da non ripetere)
1. **Cache del browser** con file JS separati: dopo ogni modifica forzare reload (`fetch(url,{cache:'reload'})`) o provare con query diversa.
2. Il loader clienti legge **il primo foglio**: nel file clienti "Istruzioni" va in fondo.
3. Mojibake nei caratteri (`âœ“`): salvare sempre UTF-8.
4. Entità HTML nei dati scrapati (`&#8211;`): `html.unescape`.
5. Tre varianti del blocco "Pre-separatori": il nome serie si deriva togliendo token (DEX, ACD, SP…) — verificare sempre il report.
6. `pptxgenjs`: `LAYOUT_WIDE`; font sicuri (Arial/Calibri); mai `#` nei colori; nessuna linea sotto ai titoli.
7. Il push git dal tool automatico a volte viene bloccato: l'utente lo esegue da terminale (`git push`).
8. Su LinkedIn serve login: si legge dal Chrome dell'utente; i cognomi di contatti di 2° grado sono abbreviati.

## 9. Presentazione commerciale (PowerPoint, brand cliente)
11 slide: copertina · come nasce un'offerta oggi (6 passaggi) · 4 numeri da raccogliere (n. offerte, % copia-incolla, tempo, impressione) · costo del copia-incolla · impressione desiderata · divisore · 5 passi · cosa c'è dentro · prima/dopo · cosa serve dal cliente (prezzi, accessori, commerciali, condizioni) · demo. **Nessun numero inventato**: dati da raccogliere in riunione. Note del relatore su ogni slide.

## 10. Cose rimaste aperte nel progetto Depureco
- Prezzi, accessori, optional, condizioni generali di vendita: da fornire dal cliente (qui segnaposto).
- Sito Netlify non creato da Claude (richiesta di conferma lasciata senza risposta): collegare la repo dal pannello Netlify (`Publish directory = dist`).
- Cognome di un commerciale non reperibile.
