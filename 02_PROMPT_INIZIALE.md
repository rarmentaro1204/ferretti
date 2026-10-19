# Prompt iniziale (da incollare nella nuova sessione di Claude)

Ciao! Devo rifare per il **settore yacht** un lavoro già fatto per un'azienda di aspiratori industriali (Depureco). In questa cartella trovi:
- `passaggio/01_HANDOFF_PROGETTO.md`: tutto ciò che è stato costruito, formati dati, scelte e trappole;
- `passaggio/04_CHECKLIST_ADATTAMENTO_YACHT.md`: cosa cambiare file per file;
- il codice sorgente del configuratore (già decompresso: `index.html`, `css/`, `js/`, `tools/`, `scraper/`), con ancora i segnaposto Depureco;
- `CLAUDE.md` con le istruzioni di progetto.

**Obiettivo:** un configuratore di offerte in HTML (stessa architettura: 5 passi, sconti a cascata con sconto extra di riga, PDF A4 con marchio, salvataggio su GitHub privata, richiamo delle offerte, dashboard per commerciale con vinte/perse, statistiche, scadenze, offerte demo multilingua), ma per un'azienda del settore yacht.

**Come voglio che lavori**
1. Leggi prima `passaggio/` e il codice. Non riscrivere da zero: **adatta** il codice esistente.
2. Fammi le domande che mancano **prima di costruire** (al massimo un giro): quale azienda/cantiere o distributore, marchio e colori (ho/non ho un manuale), fonte del catalogo (sito, Excel, PDF), come si configurano le imbarcazioni (modello + optional/allestimenti?), valuta e lingue, chi sono i commerciali, dove pubblico (Netlify/GitHub).
3. Non inventare dati: prezzi, specifiche, commerciali, condizioni di vendita. Se mancano, usa segnaposto chiari e dimmelo.
4. Lavora per tappe e verifica nel browser dopo ogni tappa (niente "dovrebbe funzionare"). Per ogni tappa un commit; il `git push` lo faccio io.
5. Rispondi in italiano, conciso, con la lista di ciò che resta da fare alla fine.

**Cose da non dimenticare:** token GitHub mai nel codice; repo dei dati clienti sempre privata (l'app rifiuta le pubbliche); nessun prezzo dentro il file pubblicato; le offerte demo non vanno mai su Excel/GitHub.

Parti da: (a) leggere il materiale, (b) riassumermi in 10 righe cosa cambierà per gli yacht, (c) farmi le domande.
