#!/usr/bin/env python3
"""Converte il catalogo Excel Azimut (foglio Macchine) in js/data/catalogo.js, caricato di default dal configuratore.
Uso: python3 tools/build_catalog_js.py excel/catalogo_azimut.xlsx
Stessa mappatura colonne->campi di js/app/xlsx-loader.js (handleXlsx).
Genera anche gli optional di partenza (motorizzazione alternativa del sito, prezzo 0)."""
import json, random, re, sys
from pathlib import Path
from openpyxl import load_workbook

ORDINE_SERIE = {"Seadeck": 1, "Fly": 2, "S": 3, "Magellano": 4, "Verve": 5, "Atlantis": 6, "Grande": 7}
RAGGIO = Path(__file__).resolve().parent.parent


def fmt(v, unita=""):
    if v in (None, ""):
        return ""
    s = f"{v:g}".replace(".", ",") if isinstance(v, (int, float)) else str(v).strip()
    if isinstance(v, (int, float)) and v >= 1000:
        s = f"{int(v):,}".replace(",", ".") if float(v).is_integer() else s
    return f"{s} {unita}".strip()


def fascia(loa):
    if not isinstance(loa, (int, float)):
        return "—"
    return "Fino a 20 m" if loa < 20 else ("20–25 m" if loa < 25 else ("25–30 m" if loa < 30 else "Oltre 30 m"))


def velocita(vmax, vcro):
    if vmax in (None, "") and vcro in (None, ""):
        return ""
    return f"{fmt(vmax)} / {fmt(vcro)} kn" if vcro not in (None, "") else f"{fmt(vmax)} kn"


def cabine(raw):
    """'4 + 1 crew' / '3/4 + 1 crew' -> '4 + 1' (neutro rispetto alla lingua; l'etichetta spiega ospiti + equipaggio)."""
    m = re.match(r"\s*([\d/]+)\s*(?:\+\s*(\d+)\s*(?:crew)?)?", str(raw or ""), re.I)
    if not m:
        return str(raw or "").strip()
    return f"{m.group(1)} + {m.group(2)}" if m.group(2) else m.group(1)


# Struttura degli optional (gruppi e numero di voci per gruppo) ricalcata dal configuratore Ferretti, ma ANONIMIZZATA:
# nessuna descrizione, codice o prezzo del listino originale (riservato). Descrizioni generiche, codici casuali (seme fisso), prezzo 0.
# (gruppo, numero voci, [(sezione IT, sezione EN), ...]) — le sezioni sono etichette di categoria generiche.
STRUTTURA_OPTIONAL = [
    ("Coperta", 43, [("Dotazioni di poppa e giochi d'acqua", "Transom equipment and water toys"), ("Verniciatura e accessori esterni", "Exterior painting and accessories")]),
    ("Interni", 16, [("Comfort e arredi interni", "Interior comfort and furniture")]),
    ("Elettronica", 49, [("Navigazione, sicurezza e telecomunicazioni", "Navigation, security and telecommunications"), ("Audio-video e intrattenimento", "Audio-video and entertainment"), ("Impianti elettrici e tecnici", "Electrical and technical equipment")]),
    ("Comfort", 9, [("Elettrodomestici", "Appliances"), ("Stabilizzatore", "Stabilizer")]),
    ("Servizi", 7, [("Assistenza e ricambi", "Aftersales and spare parts"), ("Documenti e trasporti", "Documents and transport")]),
]


def optional_generici():
    rnd = random.Random(20261102)
    usati, voci, ordine = set(), [], 10
    for gruppo, n, sezioni in STRUTTURA_OPTIONAL:
        for k in range(n):
            while True:
                code = "OP-" + "".join(rnd.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(5))
                if code not in usati:
                    usati.add(code); break
            it, en = sezioni[k * len(sezioni) // n]
            voci.append({"code": code, "desc": f"{en} — item {k + 1:02d} (to be defined)", "desc_it": f"{it} — voce {k + 1:02d} (da definire)",
                         "group": gruppo, "price": 0, "order": ordine})
            ordine += 1
    return voci


def main(xlsx):
    ws = load_workbook(xlsx)["Macchine"]
    tutte = list(ws.iter_rows(values_only=True))
    i = next(i for i, r in enumerate(tutte[:15]) if r and "Codice" in r)   # salta titolo/sottotitolo
    righe = [dict(zip(tutte[i], r)) for r in tutte[i + 1:]]
    GENERICI = optional_generici()
    out, optionals = [], {}
    for r in righe:
        if not r.get("Codice"):
            continue
        code = str(r["Codice"]).strip()
        serie = str(r.get("Famiglia") or "").strip() or "Altro"
        loa = r.get("LOA_m")
        nfoto = len([u for u in str(r.get("Foto_URL") or "").splitlines() if u.strip()])
        m = {
            "code": code, "family": serie, "category": serie, "subcategory": fascia(loa), "protection": "",
            "name": str(r.get("Nome") or code).strip(), "desc": str(r.get("Descrizione") or "").strip(), "desc_en": str(r.get("Descrizione_EN") or "").strip(),
            "story": str(r.get("Storia_IT") or "").strip(), "story_en": str(r.get("Storia_EN") or "").strip(),
            "loa": fmt(loa, "m"), "beam": fmt(r.get("Larghezza_m"), "m"), "draft": fmt(r.get("Pescaggio_m"), "m"),
            "hull": fmt(r.get("Lunghezza_scafo_m"), "m"), "cabins": cabine(r.get("Cabine")),
            "engine": str(r.get("Motore_Standard") or "").strip(),
            "speed": velocita(r.get("Vel_Max_Standard_kn"), r.get("Vel_Crociera_Standard_kn")),
            "engine_opt": str(r.get("Motore_Optional") or "").strip(),
            "speed_opt": velocita(r.get("Vel_Max_Optional_kn"), r.get("Vel_Crociera_Optional_kn")),
            "disp_empty": fmt(r.get("Dislocamento_Vuoto_kg"), "kg"), "disp_full": fmt(r.get("Dislocamento_Carico_kg"), "kg"),
            "fuel": fmt(r.get("Carburante_l"), "l"), "water": fmt(r.get("Acqua_l"), "l"), "persons": str(r.get("Posti_letto") or r.get("Persone") or "").strip(),
            "material": str(r.get("Materiale") or "").strip(), "cert": str(r.get("Certificazioni") or "").strip(),
            "url": str(r.get("URL") or ""), "url_en": str(r.get("URL_EN") or ""),
            "image": str(r.get("Immagine_URL") or ""), "imageFile": str(r.get("Immagine_File") or ""),
            "atex": False, "marking": "", "application": "",
            "price": 0, "catOrder": ORDINE_SERIE.get(serie, 99),
        }
        # foto di presentazione: solo quelle elencate nell'Excel (il file esiste in images/)
        m["photos"] = [f"{code}-{k}.jpg" for k in range(1, nfoto + 1) if (RAGGIO / "images" / f"{code}-{k}.jpg").exists()]
        m["tagline"] = ""
        out.append(m)
        if m["engine_opt"]:
            optionals[code] = [{"code": "ENG-" + code.replace("AZ-", ""), "desc": m["engine_opt"] + (f" — {m['speed_opt']}" if m["speed_opt"] else ""), "group": "Motorizzazione", "price": 0, "order": 1}]
        optionals.setdefault(code, []).extend(json.loads(json.dumps(GENERICI)))
    dest = RAGGIO / "js" / "data" / "catalogo.js"
    dest.write_text("/* GENERATO da tools/build_catalog_js.py — non modificare a mano. Fonte: %s */\n"
                    "const CATALOGO_YACHT = %s;\nconst OPTIONALS_YACHT = %s;\n"
                    % (Path(xlsx).name, json.dumps(out, ensure_ascii=False), json.dumps(optionals, ensure_ascii=False)), encoding='utf8')
    print(f"{len(out)} modelli -> {dest} · {len(GENERICI)} optional generici per modello")
    scrivi_matrice(out, optionals, RAGGIO / "excel" / "matrice_optional_azimut_TEMPLATE.xlsx")


def scrivi_matrice(modelli, optionals, dest):
    """Matrice optional in formato 'Carica matrice optional' (fogli Optional_Prezzi + Catalogo_Optional), prezzi a 0 da compilare."""
    from openpyxl import Workbook
    from openpyxl.styles import Font
    voci = [("Motorizzazione", o) for o in []] + [(o["group"], o) for o in optionals[next(iter(optionals))] if o["group"] != "Motorizzazione"]
    wb = Workbook(); ws = wb.active; ws.title = "Optional_Prezzi"
    ws.append(["Gruppo"] + [g for g, _ in voci])
    ws.append(["Codice Macchina"] + [o["code"] for _, o in voci])
    ws.append(["Descrizione"] + [o["desc"] for _, o in voci])
    for c in ws[1] + ws[2] + ws[3]:
        c.font = Font(bold=True)
    for m in modelli:
        ws.append([m["code"]] + [0] * len(voci))
    cat = wb.create_sheet("Catalogo_Optional")
    cat.append(["Codice", "Gruppo", "Ordine", "Descrizione", "Descrizione_IT", "Nota", "Nota_IT"])
    for g, o in voci:
        cat.append([o["code"], g, o["order"], o["desc"], o["desc_it"], "", ""])
    wb.save(dest)
    print("matrice optional (template, prezzi a 0) ->", dest)


if __name__ == "__main__":
    main(sys.argv[1])
