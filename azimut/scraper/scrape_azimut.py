#!/usr/bin/env python3
"""Scraper catalogo Azimut Yachts -> Excel (foglio Macchine) + immagini.

Fonte: https://azimutyachts.com (yacht-sitemap.xml -> pagine modello IT/EN, HTML statico WordPress).
Solo libreria standard + openpyxl. Pausa tra richieste, nessun login, nessun path vietato da robots.txt.
Estrae TUTTI i modelli della flotta (Seadeck, Fly, S, Magellano, Verve, Atlantis, Grande).
Prezzo = 0 (da compilare con il listino ufficiale). Stesso schema colonne del catalogo Ferretti.
Uso: python3 scrape_azimut.py [--out FILE.xlsx] [--delay 1.2] [--images DIR] [--report FILE.md]
"""
import argparse, html as H, os, re, sys, time, urllib.request
from collections import Counter
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

BASE = "https://azimutyachts.com"
UA = "Mozilla/5.0 (compatible; CatalogBot/1.0)"
SERIE_NOME = {"seadeck": "Seadeck", "fly": "Fly", "s": "S", "magellano": "Magellano", "verve": "Verve",
              "atlantis": "Atlantis", "grande": "Grande"}
ORDINE = ["Seadeck", "Fly", "S", "Magellano", "Verve", "Atlantis", "Grande"]

COLONNE = ["Codice", "Famiglia", "Categoria", "Sottocategoria", "Nome", "Prezzo",
           "LOA_m", "Larghezza_m", "Pescaggio_m", "Lunghezza_scafo_m", "Cabine", "Posti_letto",
           "Motore_Standard", "Vel_Max_Standard_kn", "Vel_Crociera_Standard_kn",
           "Motore_Optional", "Vel_Max_Optional_kn", "Vel_Crociera_Optional_kn",
           "Dislocamento_Vuoto_kg", "Dislocamento_Carico_kg", "Carburante_l", "Acqua_l", "Persone",
           "Materiale", "Certificazioni", "Exterior_Design", "Interior_Design",
           "Descrizione", "Descrizione_EN", "Storia_IT", "Storia_EN", "URL", "URL_EN", "Immagine_URL", "Immagine_File", "Foto_URL"]


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for t in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                d = r.read()
                return d if binary else d.decode("utf-8", "ignore")
        except Exception:
            if t == 2:
                raise
            time.sleep(2 * (t + 1))


def righe(page):
    page = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", "", page, flags=re.S)
    return [H.unescape(l).strip() for l in re.sub(r"<[^>]+>", "\n", page).split("\n") if l.strip()]


def num(s):
    m = re.search(r"-?\d+(?:[.,]\d+)?", s or "")
    return float(m.group(0).replace(",", ".")) if m else None


def metri(s):
    """'19,22 m (63' 1'')' -> 19.22 ; accetta anche '38,22 (125’ 5’’)'."""
    return num(s)


def kg(s):
    """'39 t (85979 lb)' -> 39000 ; '12.500 kg' -> 12500."""
    s = s or ""
    n = num(s.replace(".", "") if re.search(r"\d\.\d{3}", s) else s)
    if n is None:
        return ""
    return round(n * 1000) if re.search(r"\bt\b|ton", s.lower()) and n < 500 else round(n)


def litri(s):
    s = s or ""
    m = re.search(r"(\d[\d.,]*)\s*(?:l\b|lt|litri|liters)", s, re.I) or re.search(r"(\d[\d.,]*)", s)
    return int(re.sub(r"[.,]", "", m.group(1))) if m else ""


def elenco_modelli():
    xml = get(BASE + "/yacht-sitemap.xml")
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    it, en = {}, {}
    for u in urls:
        m = re.match(r"https://azimutyachts\.com/(it|en)/([^/]+)/([^/]+)/$", u)
        if not m:
            continue
        lang, serie_slug, slug = m.groups()
        serie = re.sub(r"^(serie-|)|(-series)$", "", serie_slug)
        (it if lang == "it" else en).setdefault((serie, slug), u)
    # accoppia IT/EN per posizione nella serie (gli slug possono differire, es. azimut-seadeck-6 vs seadeck-6)
    modelli = []
    for (serie, slug), u in it.items():
        modelli.append((SERIE_NOME.get(serie, serie.title()), slug, u))
    en_by_serie = {}
    for (serie, slug), u in en.items():
        en_by_serie.setdefault(serie, []).append((slug, u))
    return modelli, en_by_serie


def sezione(L, titolo, fine=("Apri", "Chiudi")):
    """Valori etichetta->righe del blocco 'Dati tecnici' (ultima occorrenza)."""
    idx = [i for i, l in enumerate(L) if l == "Dati tecnici"]
    base = idx[-1] if idx else 0
    fino = next((i for i in range(base, len(L)) if L[i].startswith("I dati si riferiscono") or L[i] == "Confronta gli yacht"), len(L))
    return L[base:fino]


ETICHETTE = ["Lunghezza fuori tutto", "Larghezza max", "Immersione", "Pescaggio", "Dislocamento", "Materiale di costruzione",
             "Exterior designer", "Interior designer", "Certificazioni", "Cabine", "Posti letto", "Servizi",
             "Motorizzazione", "Velocità massima", "Velocità di crociera", "Serbatoio carburante", "Serbatoi carburante",
             "Serbatoi acqua", "Serbatoio acqua", "Progetto", "Alloggi", "Performance", "Capacità serbatoi", "Principali specifiche tecniche",
             "Costruttore", "Carena", "Consumi", "Results obtained", "SLOW CRUISE", "FAST CRUISE", "Hull designer", "Persone", "Passeggeri", "Portata", "Capacità"]


def valori(blocco, prefisso):
    """Righe che seguono l'etichetta che inizia con `prefisso`, fino alla prossima etichetta nota."""
    for i, l in enumerate(blocco):
        if l.lower().startswith(prefisso.lower()):
            out = []
            for x in blocco[i + 1:]:
                if any(x.lower().startswith(e.lower()) for e in ETICHETTE) or x in ("Apri", "Chiudi"):
                    break
                out.append(x)
            return out
    return []


def motori(vals):
    """Primo = standard, successivi = optional (le pagine marcano '(OPT)' solo in alcuni casi)."""
    vals = [v for v in vals if not re.search(r"interiors", v, re.I)]
    std, opt = [], []
    for i, v in enumerate(vals):
        pulito = re.sub(r"\s+", " ", re.sub(r"\s*\(\s*OPT\.?\s*\)", "", v, flags=re.I)).strip()
        (opt if (re.search(r"\(\s*opt", v, re.I) or i > 0) else std).append(pulito)
    return std, opt


def velocita(vals):
    std = opt = None
    for v in vals:
        n = num(v)
        if re.search(r"\(\s*opt", v, re.I):
            opt = opt or n
        else:
            std = std or n
    return std, opt


def foto_pagina(page):
    """URL originali (senza suffisso -LxA) delle immagini caricate nella pagina, in ordine di apparizione."""
    out = []
    for u in re.findall(r"https://azimutyachts\.com/wp-content/uploads/[^\"'\s)\\]+?\.(?:jpg|jpeg|png|webp)", page, re.I):
        if re.search(r"-\d+x\d+\.", u):
            u = re.sub(r"-\d+x\d+(\.\w+)$", r"\1", u)
        if re.search(r"menu|logo|icon|favicon|placeholder|flag|app-|charter", u, re.I):
            continue
        out.append(u)
    return list(dict.fromkeys(out))


NEG = re.compile(r"vr|virtual|mob|desk|carbon|_tf_|-tf-|certific|pet\b|pet[-_.]|carena|hull|hotel|balance|pannelli|solar|\bga\d|-ga\d|layout|plan|render|cuore|thun|mancini|logo|\bcad\b|deck-?plan|zoom|diagram|(upper|main|lower|fly)[-_ ]?deck(?!.*\d)|flybridge\.jpg|spec|teck|dati|scaled|_ct\b|_scm|wechat|flotta|series|tte_|prev-|\.png$", re.I)
TOP = re.compile(r"running|external|exterior|profile|(^|[-_.])ext-", re.I)
EXT = re.compile(r"(^|[-_.])ext-|exterior|external|running|profile|navigat|cruis|aerial|drone|side|stern|beach|bow|cockpit|flybridge|sundeck|fun-?island|main-?deck|upper-?deck", re.I)
INT = re.compile(r"(^|[-_.])int-|suite|salon|dining|interior|cabin|master|vip|bedroom|kitchen|galley|helm|bathroom|lounge|living|owner", re.I)


def scegli_foto(urls, n=6):
    """Foto di presentazione: prima esterni (foto principale), poi interni; scarta schede tecniche/VR/layout."""
    buone = [u for u in urls if not NEG.search(os.path.basename(u))]
    est = [u for u in buone if EXT.search(os.path.basename(u)) and not INT.search(os.path.basename(u))]
    est.sort(key=lambda u: 0 if TOP.search(os.path.basename(u)) else 1)
    inn = [u for u in buone if INT.search(os.path.basename(u))]
    altre = [u for u in buone if u not in est and u not in inn]
    return (est + inn + altre)[:n]


def paragrafi(L, nome):
    """Testo introduttivo: righe lunghe dopo il titolo del modello e prima di 'Vorresti saperne di più?'."""
    try:
        a = L.index("Scroll")
    except ValueError:
        a = 0
    fine = next((i for i in range(a, len(L)) if L[i].startswith("Vorresti saperne") or L[i].startswith("Want to know")), a + 12)
    return [l for l in L[a + 1:fine] if len(l) > 60]


def parse_modello(serie, slug, url, url_en, delay):
    pag = get(url)
    L = righe(pag)
    blocco = sezione(L, "Dati tecnici")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", pag, re.S)
    titolo = H.unescape(re.sub(r"<[^>]+>", " ", h1.group(1))).strip() if h1 else ""
    nome = re.sub(r"\s+", " ", titolo) or slug.replace("-", " ").title()
    if not nome.lower().startswith(serie.lower()):
        nome = f"{serie} {nome}"
    nome = "Azimut " + re.sub(r"^azimut\s*", "", nome, flags=re.I)
    nome = re.sub(r"\b(\d+)\s*m\b", lambda m: m.group(1) + "m", nome, flags=re.I)
    codice = re.sub(r"[^A-Z0-9]+", "-", nome.upper().replace("AZIMUT ", "AZ-")).strip("-")
    r = {c: "" for c in COLONNE}
    r.update(Codice=codice, Famiglia=serie, Categoria=serie, Sottocategoria=serie, Nome=nome, Prezzo=0, URL=url)
    v = lambda p: (valori(blocco, p) or [""])
    r["LOA_m"] = metri(v("Lunghezza fuori tutto")[0]) or ""
    r["Larghezza_m"] = metri(v("Larghezza max")[0]) or ""
    imm = v("Immersione")[0] or v("Pescaggio")[0]
    r["Pescaggio_m"] = metri(imm) or ""
    r["Dislocamento_Carico_kg"] = kg(v("Dislocamento")[0])
    r["Materiale"] = v("Materiale di costruzione")[0]
    r["Exterior_Design"] = v("Exterior designer")[0]
    r["Interior_Design"] = v("Interior designer")[0]
    r["Certificazioni"] = v("Certificazioni")[0]
    cab = valori(blocco, "Cabine")
    r["Cabine"] = (cab[0] if cab else "").replace("crew", "crew").strip()
    r["Posti_letto"] = v("Posti letto")[0]
    ms, mo = motori(valori(blocco, "Motorizzazione"))
    r["Motore_Standard"] = ms[0] if ms else ""
    r["Motore_Optional"] = mo[0] if mo else ""
    vm = valori(blocco, "Velocità massima")
    vc = valori(blocco, "Velocità di crociera")
    r["Vel_Max_Standard_kn"], r["Vel_Max_Optional_kn"] = [x or "" for x in velocita(vm)]
    r["Vel_Crociera_Standard_kn"], r["Vel_Crociera_Optional_kn"] = [x or "" for x in velocita(vc)]
    r["Carburante_l"] = litri(v("Serbatoio carburante")[0] or v("Serbatoi carburante")[0])
    r["Acqua_l"] = litri(v("Serbatoi acqua")[0] or v("Serbatoio acqua")[0])
    par = paragrafi(L, nome)
    r["Descrizione"] = par[0] if par else ""
    r["Storia_IT"] = "\n\n".join(par[:4])
    foto = foto_pagina(pag)
    time.sleep(delay)
    if url_en:
        try:
            Le = righe(get(url_en))
            pe = paragrafi(Le, nome)
            r["Descrizione_EN"] = pe[0] if pe else ""
            r["Storia_EN"] = "\n\n".join(pe[:4])
            r["URL_EN"] = url_en
        except Exception as e:
            print("EN KO", url_en, e, file=sys.stderr)
        time.sleep(delay)
    return r, foto


def scrivi_excel(rows, out):
    wb = Workbook()
    ws = wb.active
    ws.title = "Macchine"
    ws["A1"] = "Catalogo Azimut Yachts (estratto dal sito ufficiale azimutyachts.com)"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = "Prezzi a 0: da compilare con il listino ufficiale. Dati tecnici dal sito (condizioni UNI ISO 8666), da verificare prima di emettere offerte."
    for c, nome in enumerate(COLONNE, 1):
        cell = ws.cell(row=4, column=c, value=nome)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1D1D1B")
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[get_column_letter(c)].width = 22 if nome not in ("Descrizione", "Descrizione_EN", "Storia_IT", "Storia_EN", "URL", "URL_EN", "Immagine_URL", "Foto_URL") else 40
    for ri, row in enumerate(rows, 5):
        for c, nome in enumerate(COLONNE, 1):
            ws.cell(row=ri, column=c, value=row.get(nome, ""))
    ws.freeze_panes = "F5"
    wb.save(out)


def salva_jpeg(dati, dest, lato=1400, q=68):
    """Ridimensiona (lato lungo max 1400 px) e salva JPEG: il repo resta leggero."""
    import io
    from PIL import Image
    im = Image.open(io.BytesIO(dati)).convert("RGB")
    im.thumbnail((lato, lato))
    im.save(dest, "JPEG", quality=q, optimize=True, progressive=True)


def scegli_en(serie, slug, en_by_serie):
    cand = en_by_serie.get(serie.lower(), [])
    cifre = re.findall(r"\d+m?|trideck", slug)
    for s, u in cand:
        if re.findall(r"\d+m?|trideck", s) == cifre:
            return u
    return ""


def main():
    ap = argparse.ArgumentParser()
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--out", default=os.path.join(here, "../excel/catalogo_azimut.xlsx"))
    ap.add_argument("--delay", type=float, default=1.2)
    ap.add_argument("--images", default=os.path.join(here, "../images"))
    ap.add_argument("--report", default=os.path.join(here, "../excel/report_scraper.md"))
    ap.add_argument("--no-images", action="store_true")
    a = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    os.makedirs(a.images, exist_ok=True)
    modelli, en_by_serie = elenco_modelli()
    modelli.sort(key=lambda m: (ORDINE.index(m[0]) if m[0] in ORDINE else 99, num(m[1]) or 0, m[1]))
    print(f"{len(modelli)} modelli trovati")
    rows, fotos = [], {}
    for serie, slug, url in modelli:
        try:
            r, foto = parse_modello(serie, slug, url, scegli_en(serie, slug, en_by_serie), a.delay)
        except Exception as e:
            print("ERRORE", url, e, file=sys.stderr)
            continue
        rows.append(r); fotos[r["Codice"]] = foto
        print(r["Codice"], "|", r["Nome"], r["LOA_m"], r["Motore_Standard"], r["Cabine"])
    # le immagini presenti in molte pagine (menu, footer) non sono foto del modello
    freq = Counter(u for f in fotos.values() for u in set(f))
    for r in rows:
        mie = scegli_foto([u for u in fotos[r["Codice"]] if freq[u] <= 2])
        r["Foto_URL"] = "\n".join(mie)
        r["Immagine_URL"] = mie[0] if mie else ""
    if not a.no_images:
        for r in rows:
            if not r["Immagine_URL"]:
                continue
            urls = r["Foto_URL"].split("\n")
            for k, u in enumerate(urls):
                f = f"{r['Codice']}-{k + 1}.jpg"
                try:
                    salva_jpeg(get(u, binary=True), os.path.join(a.images, f))
                    if k == 0:
                        r["Immagine_File"] = f
                except Exception as e:
                    print("img KO", u, e, file=sys.stderr)
                time.sleep(0.4)
    scrivi_excel(rows, a.out)
    mancanti = Counter()
    with open(a.report, "w", encoding="utf8") as fh:
        fh.write(f"# Report scraper Azimut\n\n{len(rows)} modelli.\n\n| Codice | Nome | LOA | Largh. | Immers. | Cabine | Motore | Vmax | Foto |\n|---|---|---|---|---|---|---|---|---|\n")
        for r in rows:
            fh.write(f"| {r['Codice']} | {r['Nome']} | {r['LOA_m']} | {r['Larghezza_m']} | {r['Pescaggio_m']} | {r['Cabine']} | {r['Motore_Standard']} | {r['Vel_Max_Standard_kn']} | {len(r['Foto_URL'].splitlines())} |\n")
            for c in ("LOA_m", "Larghezza_m", "Cabine", "Motore_Standard", "Immagine_URL"):
                if not r[c]:
                    mancanti[c] += 1
        fh.write("\nCampi vuoti: " + (", ".join(f"{k}={v}" for k, v in mancanti.items()) or "nessuno") + "\n")
    print("scritto", a.out, len(rows), "· campi vuoti:", dict(mancanti))


if __name__ == "__main__":
    main()
