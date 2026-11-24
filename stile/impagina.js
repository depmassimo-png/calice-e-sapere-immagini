// Calice e Sapere: impaginazione della home su due colonne (laboratorio, 24/11/2026).
// Eseguito da build-tema.js dopo l'aggiunta del tema. Lavora solo su public/index.html.
// Colonna principale: percorso, rubriche, strumenti (e sezioni non riconosciute).
// Colonna laterale: novita, vino della settimana, frase, in vigna questo mese, app.
// Sul telefono il CSS rimette tutto su una colonna, con la laterale in fondo.
// Se manca il percorso o qualcosa non torna, la pagina resta com'era. Nessun backslash.
const fs = require("fs");
const path = require("path");

function sezioni(h, da, a) {
  const out = [];
  let i = da;
  while (true) {
    const s = h.indexOf("<section", i);
    if (s < 0 || s >= a) break;
    const e = h.indexOf("</section>", s);
    if (e < 0 || e >= a) break;
    const interno = h.slice(s + 8, e);
    if (interno.indexOf("<section") >= 0) return null; // sezioni annidate: non tocco nulla
    out.push({ s: s, e: e + 10, t: h.slice(s, e + 10) });
    i = e + 10;
  }
  return out;
}

function tipo(t) {
  const apertura = t.slice(0, t.indexOf(">") + 1);
  if (t.indexOf('id="tiles"') >= 0) return "percorso";
  if (apertura.indexOf("rubriche-home") >= 0) return "rubriche";
  if (t.indexOf("Strumenti di studio") >= 0) return "strumenti";
  if (apertura.indexOf("vino-home") >= 0) return "vino";
  if (apertura.indexOf("novita") >= 0) return "novita";
  if (t.indexOf("In vigna questo mese") >= 0) return "invigna";
  if (t.indexOf("La frase della settimana") >= 0) return "frase";
  if (apertura.indexOf("qs-home") >= 0) return "quiz";
  if (t.indexOf("ca-shot") >= 0 && t.indexOf('href="/cantinapp"') >= 0) return "cantinapp";
  return "altro";
}

function impagina(h) {
  const m1 = h.indexOf("<main>");
  const m2 = h.indexOf("</main>");
  if (m1 < 0 || m2 < 0) return { h: h, esito: "saltata: main non trovato" };
  const lista = sezioni(h, m1, m2);
  if (!lista || !lista.length) return { h: h, esito: "saltata: sezioni non riconosciute" };
  const per = {};
  const altre = [];
  for (const x of lista) {
    const k = tipo(x.t);
    if (k === "altro" || per[k]) altre.push(x.t); else per[k] = x.t;
  }
  if (!per.percorso) return { h: h, esito: "saltata: percorso non trovato" };
  const principale = [per.percorso, per.rubriche, per.strumenti].concat(altre).filter(Boolean).join("");
  const laterale = [per.novita, per.vino, per.frase, per.invigna, per.cantinapp, per.quiz].filter(Boolean).join("");
  const blocco = '<div class="home-grid"><div class="home-main">' + principale + '</div><aside class="home-lato" aria-label="In evidenza">' + laterale + "</aside></div>";
  // tolgo le sezioni dalla fine all'inizio, poi metto il blocco al posto della prima
  let out = h;
  for (let j = lista.length - 1; j >= 0; j--) out = out.slice(0, lista[j].s) + (j === 0 ? blocco : "") + out.slice(lista[j].e);
  const usate = Object.keys(per);
  return { h: out, esito: "ok: principale " + [per.percorso && "percorso", per.rubriche && "rubriche", per.strumenti && "strumenti"].filter(Boolean).join(", ") + (altre.length ? " + " + altre.length + " altre" : "") + "; laterale " + usate.filter(k => ["novita", "vino", "frase", "invigna", "cantinapp", "quiz"].indexOf(k) >= 0).join(", ") };
}

module.exports = function (PUB) {
  const f = path.join(PUB, "index.html");
  if (!fs.existsSync(f)) return "saltata: index.html mancante";
  const h = fs.readFileSync(f, "utf8");
  if (h.indexOf("home-grid") >= 0) return "gia presente";
  const r = impagina(h);
  if (r.h !== h) fs.writeFileSync(f, r.h);
  return r.esito;
};
module.exports.impagina = impagina;
