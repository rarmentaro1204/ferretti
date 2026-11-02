# Brand identity — Configuratore Azimut Yachts

> Fonte: **kit brand ufficiale Azimut Yachts Avigliana** (Delfin Group): palette, tipografia, logo e regole d'uso. A differenza di Ferretti, qui l'identità **non è ricostruita**: il wordmark in `assets/azimut-logo-wordmark.png` è quello ufficiale.

## Carattere
Minimale, elegante, "premium yachting": molto bianco, tipografia sottile, palette quasi monocromatica. **Un solo accento rosso per pagina**, mai dominante.

## Colori
| Token (`css/brand.css`) | Hex | Uso nel configuratore |
|---|---|---|
| `--navy` / `--ink` | `#1D1D1B` | testo, titoli, pulsanti primari, logo |
| `--red` | `#C21632` | accento unico: filetto di copertina, passo attivo, totale, dettagli |
| `--muted` / `--steel` | `#6E6E6F` | testo secondario, didascalie |
| `--yellow-700` / `--steelL` | `#A1A3A5` | elementi UI secondari |
| `--yellow` / `--valtint` | `#C3C6CA` | bordi, separatori |
| `--line` | `#D7D8DB` | filetti, sfondi alternati |
| `--soft` / `--greybar` | `#EBECED` | sfondi sezione chiari |
| bianco | `#FFFFFF` | sfondo principale |

(I nomi `--red/--yellow/--navy` sono storici, ereditati dal template Depureco/Ferretti; il valore è quello Azimut. Nessun giallo/oro/blu nel marchio.)

## Tipografia
**Helvetica Neue** — Light per titoli, Regular per il testo; fallback **Arial**. Nessun font web, nessun serif, nessun corsivo decorativo. Titoletti/eyebrow in maiuscolo con spaziatura ampia.

## Logo
`assets/azimut-logo-wordmark.png` (nero, fondo trasparente), incorporato in `js/config/brand.js`. Non deformare, ruotare, ricolorare né ombreggiare; spazio di rispetto ≥ altezza della "A". Poiché non è disponibile la versione bianca, **il documento non usa sfondi scuri**: la copertina è bianca con la foto in alto e il logo su fascia chiara, in alto a sinistra.

## Tono di voce
Formale-elegante, frasi pulite, niente superlativi. Si scrive «yacht» e «imbarcazione», «concessionaria», «cliente», «consulente commerciale».

## Cosa evitare
Colori fuori palette, font diversi da Helvetica Neue/Arial, loghi di terzi accanto al logo senza spazio di rispetto, layout affollati, toni promozionali.

## Applicazione nel configuratore
- App: sfondo bianco, filetti `#D7D8DB`, pulsanti neri; rosso solo su filetti attivi (`css/luxury.css`).
- Documento A4: copertina bianca (foto, filetto rosso, titolo Light maiuscolo), lettera, una pagina per modello, tabelle a filetti, piè di pagina grigio.
- Template Office del kit (`Azimut Official Template for Presentation.pptx`, letterhead, ecc.) restano nel kit: per slide o lettere fuori dal configuratore partire da quelli.

## Da fare
Anagrafica emittente (`js/config/brand.js`), commerciali (`js/data/defaults.js`), condizioni generali (`js/data/general-terms.js`) sono segnaposto.
